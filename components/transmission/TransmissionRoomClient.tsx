'use client';

import Image from 'next/image';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  RealtimeChannel,
} from '@supabase/supabase-js';

import {
  getSupabaseBrowser,
} from '@/lib/supabase-browser';

type Participant = {
  id: string;
  discordId: string;
  name: string;
  image: string | null;
  isOwner: boolean;
  isSharing: boolean;
  joinedAt: string;
};

type SignalPayload =
  | {
      type: 'watch-request';
      senderId: string;
      targetId: string;
    }
  | {
      type: 'watch-stopped';
      senderId: string;
      targetId: string;
    }
  | {
      type: 'offer';
      senderId: string;
      targetId: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: 'answer';
      senderId: string;
      targetId: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: 'ice-candidate';
      senderId: string;
      targetId: string;
      candidate: RTCIceCandidateInit;
    };

type TransmissionRoomClientProps = {
  code: string;
  name: string;
  discordId: string;
  image: string | null;
  isOwner: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

const ICE_SERVERS: RTCIceServer[] = [
  {
    urls:
      'stun:stun.cloudflare.com:3478',
  },
];

function UserAvatar({
  image,
  name,
  size = 44,
}: {
  image: string | null;
  name: string;
  size?: number;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-line-soft bg-bg-deep"
      style={{
        width: size,
        height: size,
      }}
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display text-lg text-accent-hot">
          {name
            .charAt(0)
            .toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default function TransmissionRoomClient({
  code,
  name,
  discordId,
  image,
  isOwner,
  supabaseUrl,
  supabaseAnonKey,
}: TransmissionRoomClientProps) {
  const [
    participants,
    setParticipants,
  ] = useState<Participant[]>([]);

  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState<
    'connecting' |
    'connected' |
    'error'
  >('connecting');

  const [
    isSharing,
    setIsSharing,
  ] = useState(false);

  const [
    watchingId,
    setWatchingId,
  ] = useState<string | null>(
    null,
  );

  const [
    volume,
    setVolume,
  ] = useState(1);

  const [
    isMuted,
    setIsMuted,
  ] = useState(false);

  const [
    copiedInvite,
    setCopiedInvite,
  ] = useState(false);

  const [
    showRoomCode,
    setShowRoomCode,
  ] = useState(true);

  const [
    copiedRoomCode,
    setCopiedRoomCode,
  ] = useState(false);

  const watchingIdRef =
    useRef<string | null>(
      null,
    );

  const isSharingRef =
    useRef(false);

  const localStreamRef =
    useRef<MediaStream | null>(
      null,
    );

  const remoteVideoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  const outgoingPeersRef =
    useRef<
      Map<
        string,
        RTCPeerConnection
      >
    >(
      new Map(),
    );

  const incomingPeerRef =
    useRef<{
      streamerId: string;
      peer: RTCPeerConnection;
    } | null>(null);

  const pendingIceRef =
    useRef<
      Map<
        string,
        RTCIceCandidateInit[]
      >
    >(
      new Map(),
    );

  const channelRef =
    useRef<RealtimeChannel | null>(
      null,
    );

  const participantId =
    useMemo(() => {
      if (
        typeof crypto !==
          'undefined' &&
        'randomUUID' in crypto
      ) {
        return crypto.randomUUID();
      }

      return `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
    }, []);

  const normalizedCode =
    useMemo(
      () =>
        code
          .trim()
          .toUpperCase(),
      [code],
    );

  function closeOutgoingPeer(
    viewerId: string,
  ) {
    const peer =
      outgoingPeersRef.current.get(
        viewerId,
      );

    if (!peer) {
      return;
    }

    peer.ontrack = null;
    peer.onicecandidate =
      null;
    peer.onconnectionstatechange =
      null;

    peer.close();

    outgoingPeersRef.current.delete(
      viewerId,
    );

    pendingIceRef.current.delete(
      viewerId,
    );
  }

  function closeAllOutgoingPeers() {
    outgoingPeersRef.current.forEach(
      (
        peer,
        viewerId,
      ) => {
        peer.ontrack = null;
        peer.onicecandidate =
          null;
        peer.onconnectionstatechange =
          null;

        peer.close();

        pendingIceRef.current.delete(
          viewerId,
        );
      },
    );

    outgoingPeersRef.current.clear();
  }

  function closeIncomingPeer() {
    const current =
      incomingPeerRef.current;

    if (current) {
      current.peer.ontrack =
        null;

      current.peer.onicecandidate =
        null;

      current.peer.onconnectionstatechange =
        null;

      current.peer.close();

      pendingIceRef.current.delete(
        current.streamerId,
      );
    }

    incomingPeerRef.current =
      null;

    if (
      remoteVideoRef.current
    ) {
      remoteVideoRef.current.srcObject =
        null;
    }
  }

  async function sendSignal(
    payload: SignalPayload,
  ) {
    const channel =
      channelRef.current;

    if (!channel) {
      return;
    }

    await channel.send({
      type:
        'broadcast',

      event:
        'webrtc-signal',

      payload,
    });
  }

  async function updatePresence(
    sharing: boolean,
  ) {
    const channel =
      channelRef.current;

    if (!channel) {
      return;
    }

    await channel.track({
      id:
        participantId,

      discordId,

      name,

      image,

      isOwner,

      isSharing:
        sharing,

      joinedAt:
        new Date()
          .toISOString(),
    });
  }

  function createOutgoingPeer(
    viewerId: string,
  ) {
    const existing =
      outgoingPeersRef.current.get(
        viewerId,
      );

    if (
      existing &&
      existing.connectionState !==
        'closed' &&
      existing.connectionState !==
        'failed'
    ) {
      return existing;
    }

    if (existing) {
      existing.close();

      outgoingPeersRef.current.delete(
        viewerId,
      );
    }

    const peer =
      new RTCPeerConnection({
        iceServers:
          ICE_SERVERS,
      });

    peer.onicecandidate =
      (event) => {
        if (
          !event.candidate
        ) {
          return;
        }

        void sendSignal({
          type:
            'ice-candidate',

          senderId:
            participantId,

          targetId:
            viewerId,

          candidate:
            event.candidate.toJSON(),
        });
      };

    peer.onconnectionstatechange =
      () => {
        console.log(
          '[WEBRTC] Saída:',
          viewerId,
          peer.connectionState,
        );

        if (
          peer.connectionState ===
            'failed' ||
          peer.connectionState ===
            'closed'
        ) {
          closeOutgoingPeer(
            viewerId,
          );
        }
      };

    outgoingPeersRef.current.set(
      viewerId,
      peer,
    );

    return peer;
  }

  function createIncomingPeer(
    streamerId: string,
  ) {
    const current =
      incomingPeerRef.current;

    if (
      current &&
      current.streamerId ===
        streamerId &&
      current.peer.connectionState !==
        'closed' &&
      current.peer.connectionState !==
        'failed'
    ) {
      return current.peer;
    }

    closeIncomingPeer();

    const peer =
      new RTCPeerConnection({
        iceServers:
          ICE_SERVERS,
      });

    peer.onicecandidate =
      (event) => {
        if (
          !event.candidate
        ) {
          return;
        }

        void sendSignal({
          type:
            'ice-candidate',

          senderId:
            participantId,

          targetId:
            streamerId,

          candidate:
            event.candidate.toJSON(),
        });
      };

    peer.ontrack =
      (event) => {
        const [
          stream,
        ] = event.streams;

        if (
          !stream ||
          !remoteVideoRef.current
        ) {
          return;
        }

        const video =
          remoteVideoRef.current;

        video.srcObject =
          stream;

        video.volume =
          volume;

        video.muted =
          isMuted;

        void video
          .play()
          .catch(
            (error) => {
              console.warn(
                '[WEBRTC] Autoplay bloqueado:',
                error,
              );
            },
          );
      };

    peer.onconnectionstatechange =
      () => {
        console.log(
          '[WEBRTC] Entrada:',
          streamerId,
          peer.connectionState,
        );

        if (
          peer.connectionState ===
            'failed'
        ) {
          closeIncomingPeer();

          watchingIdRef.current =
            null;

          setWatchingId(
            null,
          );
        }
      };

    incomingPeerRef.current =
      {
        streamerId,
        peer,
      };

    return peer;
  }

  function ensureStreamTracks(
    peer: RTCPeerConnection,
    stream: MediaStream,
  ) {
    const senders =
      peer.getSenders();

    stream
      .getTracks()
      .forEach(
        (track) => {
          const alreadyAdded =
            senders.some(
              (sender) =>
                sender.track?.id ===
                track.id,
            );

          if (
            alreadyAdded
          ) {
            return;
          }

          peer.addTrack(
            track,
            stream,
          );
        },
      );
  }

  async function flushPendingIce(
    peerId: string,
    peer: RTCPeerConnection,
  ) {
    const pending =
      pendingIceRef.current.get(
        peerId,
      );

    if (
      !pending ||
      pending.length === 0
    ) {
      return;
    }

    for (
      const candidate of
      pending
    ) {
      try {
        await peer.addIceCandidate(
          new RTCIceCandidate(
            candidate,
          ),
        );
      } catch (error) {
        console.warn(
          '[WEBRTC] ICE pendente inválido:',
          error,
        );
      }
    }

    pendingIceRef.current.delete(
      peerId,
    );
  }

  async function handleWatchRequest(
    viewerId: string,
  ) {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const peer =
      createOutgoingPeer(
        viewerId,
      );

    ensureStreamTracks(
      peer,
      stream,
    );

    const offer =
      await peer.createOffer();

    await peer.setLocalDescription(
      offer,
    );

    if (
      !peer.localDescription
    ) {
      return;
    }

    await sendSignal({
      type:
        'offer',

      senderId:
        participantId,

      targetId:
        viewerId,

      sdp:
        peer.localDescription,
    });
  }

  async function handleOffer(
    streamerId: string,
    sdp:
      RTCSessionDescriptionInit,
  ) {
    if (
      watchingIdRef.current !==
      streamerId
    ) {
      return;
    }

    const peer =
      createIncomingPeer(
        streamerId,
      );

    await peer.setRemoteDescription(
      new RTCSessionDescription(
        sdp,
      ),
    );

    await flushPendingIce(
      streamerId,
      peer,
    );

    const answer =
      await peer.createAnswer();

    await peer.setLocalDescription(
      answer,
    );

    if (
      !peer.localDescription
    ) {
      return;
    }

    await sendSignal({
      type:
        'answer',

      senderId:
        participantId,

      targetId:
        streamerId,

      sdp:
        peer.localDescription,
    });
  }

  async function handleAnswer(
    viewerId: string,
    sdp:
      RTCSessionDescriptionInit,
  ) {
    const peer =
      outgoingPeersRef.current.get(
        viewerId,
      );

    if (!peer) {
      return;
    }

    await peer.setRemoteDescription(
      new RTCSessionDescription(
        sdp,
      ),
    );

    await flushPendingIce(
      viewerId,
      peer,
    );
  }

  async function handleIceCandidate(
    senderId: string,
    candidate:
      RTCIceCandidateInit,
  ) {
    const outgoingPeer =
      outgoingPeersRef.current.get(
        senderId,
      );

    if (outgoingPeer) {
      if (
        !outgoingPeer.remoteDescription
      ) {
        const pending =
          pendingIceRef.current.get(
            senderId,
          ) ?? [];

        pending.push(
          candidate,
        );

        pendingIceRef.current.set(
          senderId,
          pending,
        );

        return;
      }

      await outgoingPeer.addIceCandidate(
        new RTCIceCandidate(
          candidate,
        ),
      );

      return;
    }

    const incoming =
      incomingPeerRef.current;

    if (
      incoming &&
      incoming.streamerId ===
        senderId
    ) {
      if (
        !incoming.peer.remoteDescription
      ) {
        const pending =
          pendingIceRef.current.get(
            senderId,
          ) ?? [];

        pending.push(
          candidate,
        );

        pendingIceRef.current.set(
          senderId,
          pending,
        );

        return;
      }

      await incoming.peer.addIceCandidate(
        new RTCIceCandidate(
          candidate,
        ),
      );

      return;
    }

    const pending =
      pendingIceRef.current.get(
        senderId,
      ) ?? [];

    pending.push(
      candidate,
    );

    pendingIceRef.current.set(
      senderId,
      pending,
    );
  }

  async function startScreenShare() {
    if (
      isSharingRef.current
    ) {
      return;
    }

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getDisplayMedia
      ) {
        return;
      }

      const stream =
        await navigator.mediaDevices
          .getDisplayMedia({
            video: {
              frameRate: {
                ideal: 30,
                max: 60,
              },
            },

            audio:
              true,
          });

      const videoTracks =
        stream.getVideoTracks();

      if (
        videoTracks.length ===
        0
      ) {
        stream
          .getTracks()
          .forEach(
            (track) => {
              track.stop();
            },
          );

        return;
      }

      localStreamRef.current =
        stream;

      isSharingRef.current =
        true;

      setIsSharing(
        true,
      );

      await updatePresence(
        true,
      );

      const videoTrack =
        videoTracks[0];

      videoTrack.onended =
        () => {
          void stopScreenShare();
        };
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name ===
          'NotAllowedError'
      ) {
        return;
      }

      console.error(
        '[TRANSMISSÃO] Erro ao compartilhar tela:',
        error,
      );
    }
  }

  async function stopScreenShare() {
    const stream =
      localStreamRef.current;

    if (stream) {
      stream
        .getTracks()
        .forEach(
          (track) => {
            track.onended =
              null;

            track.stop();
          },
        );
    }

    localStreamRef.current =
      null;

    closeAllOutgoingPeers();

    isSharingRef.current =
      false;

    setIsSharing(
      false,
    );

    await updatePresence(
      false,
    );
  }

  async function watchStreamer(
    streamerId: string,
  ) {
    if (
      streamerId ===
      participantId
    ) {
      return;
    }

    const previousWatchingId =
      watchingIdRef.current;

    if (
      previousWatchingId &&
      previousWatchingId !==
        streamerId
    ) {
      await sendSignal({
        type:
          'watch-stopped',

        senderId:
          participantId,

        targetId:
          previousWatchingId,
      });
    }

    closeIncomingPeer();

    watchingIdRef.current =
      streamerId;

    setWatchingId(
      streamerId,
    );

    createIncomingPeer(
      streamerId,
    );

    await sendSignal({
      type:
        'watch-request',

      senderId:
        participantId,

      targetId:
        streamerId,
    });
  }

  async function stopWatching() {
    const currentWatchingId =
      watchingIdRef.current;

    if (
      currentWatchingId
    ) {
      await sendSignal({
        type:
          'watch-stopped',

        senderId:
          participantId,

        targetId:
          currentWatchingId,
      });
    }

    closeIncomingPeer();

    watchingIdRef.current =
      null;

    setWatchingId(
      null,
    );
  }

  function toggleMute() {
    const video =
      remoteVideoRef.current;

    if (!video) {
      return;
    }

    video.muted =
      !video.muted;

    setIsMuted(
      video.muted,
    );
  }

  function changeVolume(
    event:
      React.ChangeEvent<HTMLInputElement>,
  ) {
    const value =
      Number(
        event.target.value,
      );

    setVolume(
      value,
    );

    const video =
      remoteVideoRef.current;

    if (!video) {
      return;
    }

    video.volume =
      value;

    if (
      value === 0
    ) {
      video.muted =
        true;

      setIsMuted(
        true,
      );

      return;
    }

    if (
      video.muted
    ) {
      video.muted =
        false;

      setIsMuted(
        false,
      );
    }
  }

  async function toggleFullscreen() {
    const video =
      remoteVideoRef.current;

    if (!video) {
      return;
    }

    try {
      if (
        document.fullscreenElement
      ) {
        await document.exitFullscreen();

        return;
      }

      await video.requestFullscreen();
    } catch (error) {
      console.error(
        '[TRANSMISSÃO] Fullscreen:',
        error,
      );
    }
  }

  async function copyInvite() {
    try {
      const url =
        `${window.location.origin}/transmissao/${normalizedCode}`;

      await navigator.clipboard.writeText(
        url,
      );

      setCopiedInvite(
        true,
      );

      window.setTimeout(
        () => {
          setCopiedInvite(
            false,
          );
        },
        2000,
      );
    } catch (error) {
      console.error(
        '[TRANSMISSÃO] Erro ao copiar convite:',
        error,
      );
    }
  }

  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(
        normalizedCode,
      );

      setCopiedRoomCode(
        true,
      );

      window.setTimeout(
        () => {
          setCopiedRoomCode(
            false,
          );
        },
        1800,
      );
    } catch (error) {
      console.error(
        '[TRANSMISSÃO] Erro ao copiar código:',
        error,
      );
    }
  }

  useEffect(() => {
    const supabase =
      getSupabaseBrowser(
        supabaseUrl,
        supabaseAnonKey,
      );

    const channelName =
      `transmission:${normalizedCode}`;

    const channel =
      supabase.channel(
        channelName,
        {
          config: {
            private:
              false,

            presence: {
              key:
                participantId,
            },

            broadcast: {
              self:
                false,
            },
          },
        },
      );

    channelRef.current =
      channel;

    function syncParticipants() {
      const state =
        channel.presenceState();

      const nextParticipants:
        Participant[] = [];

      Object.entries(
        state,
      ).forEach(
        ([
          presenceKey,
          entries,
        ]) => {
          entries.forEach(
            (entry) => {
              const data =
                entry as unknown as {
                  id?: string;
                  discordId?: string;
                  name?: string;
                  image?: string | null;
                  isOwner?: boolean;
                  isSharing?: boolean;
                  joinedAt?: string;
                };

              if (
                !data.name
              ) {
                return;
              }

              nextParticipants.push({
                id:
                  data.id ??
                  presenceKey,

                discordId:
                  data.discordId ??
                  '',

                name:
                  data.name,

                image:
                  typeof data.image ===
                  'string'
                    ? data.image
                    : null,

                isOwner:
                  Boolean(
                    data.isOwner,
                  ),

                isSharing:
                  Boolean(
                    data.isSharing,
                  ),

                joinedAt:
                  data.joinedAt ??
                  '',
              });
            },
          );
        },
      );

      const unique =
        Array.from(
          new Map(
            nextParticipants.map(
              (
                participant,
              ) => [
                participant.id,
                participant,
              ],
            ),
          ).values(),
        );

      unique.sort(
        (a, b) => {
          if (
            a.isSharing !==
            b.isSharing
          ) {
            return a.isSharing
              ? -1
              : 1;
          }

          if (
            a.isOwner !==
            b.isOwner
          ) {
            return a.isOwner
              ? -1
              : 1;
          }

          return a.name.localeCompare(
            b.name,
            'pt-BR',
          );
        },
      );

      setParticipants(
        unique,
      );

      const currentWatchingId =
        watchingIdRef.current;

      if (
        currentWatchingId
      ) {
        const watched =
          unique.find(
            (
              participant,
            ) =>
              participant.id ===
              currentWatchingId,
          );

        if (
          !watched ||
          !watched.isSharing
        ) {
          closeIncomingPeer();

          watchingIdRef.current =
            null;

          setWatchingId(
            null,
          );
        }
      }
    }

    channel.on(
      'presence',
      {
        event:
          'sync',
      },
      syncParticipants,
    );

    channel.on(
      'presence',
      {
        event:
          'join',
      },
      syncParticipants,
    );

    channel.on(
      'presence',
      {
        event:
          'leave',
      },
      syncParticipants,
    );

    channel.on(
      'broadcast',
      {
        event:
          'webrtc-signal',
      },
      async ({
        payload,
      }) => {
        const signal =
          payload as SignalPayload;

        if (
          !signal ||
          signal.senderId ===
            participantId ||
          signal.targetId !==
            participantId
        ) {
          return;
        }

        try {
          switch (
            signal.type
          ) {
            case 'watch-request': {
              if (
                localStreamRef.current
              ) {
                await handleWatchRequest(
                  signal.senderId,
                );
              }

              break;
            }

            case 'watch-stopped': {
              closeOutgoingPeer(
                signal.senderId,
              );

              break;
            }

            case 'offer': {
              await handleOffer(
                signal.senderId,
                signal.sdp,
              );

              break;
            }

            case 'answer': {
              await handleAnswer(
                signal.senderId,
                signal.sdp,
              );

              break;
            }

            case 'ice-candidate': {
              await handleIceCandidate(
                signal.senderId,
                signal.candidate,
              );

              break;
            }
          }
        } catch (error) {
          console.error(
            '[WEBRTC] Erro no signaling:',
            error,
          );
        }
      },
    );

    channel.subscribe(
      async (
        status,
        error,
      ) => {
        if (
          status ===
          'SUBSCRIBED'
        ) {
          setConnectionStatus(
            'connected',
          );

          await channel.track({
            id:
              participantId,

            discordId,

            name,

            image,

            isOwner,

            isSharing:
              isSharingRef.current,

            joinedAt:
              new Date()
                .toISOString(),
          });

          return;
        }

        if (
          status ===
            'CHANNEL_ERROR' ||
          status ===
            'TIMED_OUT'
        ) {
          console.error(
            '[TRANSMISSÃO] Realtime:',
            error,
          );

          setConnectionStatus(
            'error',
          );
        }
      },
    );

    return () => {
      const stream =
        localStreamRef.current;

      if (stream) {
        stream
          .getTracks()
          .forEach(
            (track) => {
              track.onended =
                null;

              track.stop();
            },
          );
      }

      localStreamRef.current =
        null;

      closeAllOutgoingPeers();

      closeIncomingPeer();

      watchingIdRef.current =
        null;

      isSharingRef.current =
        false;

      void channel.untrack();

      void supabase.removeChannel(
        channel,
      );

      channelRef.current =
        null;
    };
  }, [
    normalizedCode,
    participantId,
    discordId,
    name,
    image,
    isOwner,
    supabaseUrl,
    supabaseAnonKey,
  ]);

  const statusLabel =
    connectionStatus ===
    'connected'
      ? 'conectado'
      : connectionStatus ===
        'error'
        ? 'erro de conexão'
        : 'conectando';

  const liveParticipants =
    participants.filter(
      (participant) =>
        participant.isSharing,
    );

  const watchingParticipant =
    participants.find(
      (participant) =>
        participant.id ===
        watchingId,
    );

  return (
    <main className="relative z-[1] min-h-screen overflow-hidden px-3 pb-6 pt-[90px] sm:px-5">
      <div className="pointer-events-none absolute left-1/2 top-[25%] h-[700px] w-[1200px] -translate-x-1/2 rounded-full bg-accent-hot/[0.05] blur-[180px]" />

      <div className="relative mx-auto max-w-[1500px]">

        {/* CABEÇALHO */}
        <header className="mb-3 overflow-hidden rounded-[22px] border border-line-soft bg-bg-mid/30 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-accent-hot/70 to-transparent" />

          <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            {/* PERFIL + SALA */}
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative">
                <UserAvatar
                  image={image}
                  name={name}
                  size={48}
                />

                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-bg-deep ${
                    connectionStatus === 'connected'
                      ? 'bg-emerald-400'
                      : connectionStatus === 'error'
                        ? 'bg-red-400'
                        : 'bg-yellow-300'
                  }`}
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-display text-[1.12rem] text-text-main">
                    {name}
                  </p>

                  {isOwner && (
                    <span className="rounded-full border border-accent-hot/25 bg-accent-hot/[0.05] px-2 py-0.5 text-[0.44rem] font-bold uppercase tracking-[0.11em] text-accent-hot">
                      dono
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-[0.5rem] font-bold uppercase tracking-[0.16em] text-text-dim/55">
                    sala privada
                  </span>

                  <span className="flex items-center gap-1.5 text-[0.54rem] text-text-dim">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        connectionStatus === 'connected'
                          ? 'bg-emerald-400'
                          : connectionStatus === 'error'
                            ? 'bg-red-400'
                            : 'animate-pulse bg-yellow-300'
                      }`}
                    />
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* CÓDIGO + AÇÕES */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              <div className="flex min-h-11 items-center rounded-xl border border-line-soft bg-bg-deep/30 p-1">
                <button
                  type="button"
                  onClick={copyRoomCode}
                  title="Copiar código da sala"
                  className="group flex min-h-9 items-center gap-2 rounded-lg px-3 transition hover:bg-accent-hot/[0.06]"
                >
                  <span className="text-[0.45rem] font-bold uppercase tracking-[0.14em] text-text-dim/55">
                    sala
                  </span>

                  <span className="min-w-[74px] font-mono text-[0.64rem] font-bold tracking-[0.17em] text-text-main transition group-hover:text-accent-hot">
                    {showRoomCode
                      ? normalizedCode
                      : '••••••'}
                  </span>

                  <span className="text-[0.56rem] text-text-dim transition group-hover:text-accent-hot">
                    {copiedRoomCode
                      ? '✓'
                      : '⧉'}
                  </span>
                </button>

                <div className="mx-1 h-5 w-px bg-line-soft" />

                <button
                  type="button"
                  onClick={() =>
                    setShowRoomCode(
                      (current) => !current,
                    )
                  }
                  title={
                    showRoomCode
                      ? 'Ocultar código'
                      : 'Mostrar código'
                  }
                  aria-label={
                    showRoomCode
                      ? 'Ocultar código da sala'
                      : 'Mostrar código da sala'
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-text-dim transition hover:bg-accent-hot/[0.06] hover:text-accent-hot"
                >
                  {showRoomCode ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m3 3 18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a15 15 0 0 1-2.1 3.2" />
                      <path d="M6.6 6.6C3.6 8.6 2 12 2 12s3.5 8 10 8a9.8 9.8 0 0 0 4.1-.9" />
                    </svg>
                  )}
                </button>
              </div>

              {!isSharing ? (
                <button
                  type="button"
                  onClick={startScreenShare}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent-hot px-4 py-2.5 text-[0.57rem] font-bold uppercase tracking-[0.1em] text-bg-deep transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="13"
                      rx="2"
                    />
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                  </svg>

                  compartilhar tela
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopScreenShare}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-red-500/[0.07] px-4 py-2.5 text-[0.57rem] font-bold uppercase tracking-[0.1em] text-red-300 transition hover:bg-red-500/15"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                  parar transmissão
                </button>
              )}

              <button
                type="button"
                onClick={copyInvite}
                className="min-h-11 rounded-xl border border-line-soft bg-bg-deep/20 px-4 py-2.5 text-[0.57rem] font-bold uppercase tracking-[0.1em] text-text-dim transition hover:border-accent-hot/35 hover:bg-accent-hot/[0.04] hover:text-accent-hot"
              >
                {copiedInvite
                  ? 'convite copiado ✓'
                  : 'copiar convite'}
              </button>
            </div>
          </div>
        </header>

        {/* CONTEÚDO */}
        <div className="grid min-h-[680px] overflow-hidden rounded-[24px] border border-line-soft bg-bg-mid/25 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-lg lg:grid-cols-[minmax(0,1fr)_310px]">

          {/* PLAYER */}
          <section className="relative flex min-h-[540px] items-center justify-center overflow-hidden bg-black/90">

            <video
              ref={
                remoteVideoRef
              }
              autoPlay
              playsInline
              muted={
                isMuted
              }
              className={`absolute inset-0 h-full w-full object-contain ${
                watchingId
                  ? 'block'
                  : 'hidden'
              }`}
            />

            {/* IDENTIFICAÇÃO DA LIVE */}
            {watchingParticipant && (
              <div className="absolute left-4 top-4 z-[4] flex items-center gap-3 rounded-2xl border border-line-soft bg-bg-deep/85 px-3 py-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl">

                <UserAvatar
                  image={
                    watchingParticipant.image
                  }
                  name={
                    watchingParticipant.name
                  }
                  size={
                    34
                  }
                />

                <div>
                  <p className="text-[0.66rem] font-semibold text-text-main">
                    {
                      watchingParticipant.name
                    }
                  </p>

                  <p className="mt-0.5 flex items-center gap-1.5 text-[0.48rem] font-bold uppercase tracking-[0.12em] text-accent-hot">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-hot" />

                    ao vivo
                  </p>
                </div>

              </div>
            )}

            {/* CONTROLES */}
            {watchingId && (
              <div className="absolute bottom-4 left-1/2 z-[5] flex w-[calc(100%-2rem)] max-w-[680px] -translate-x-1/2 items-center gap-3 rounded-2xl border border-line-soft bg-bg-deep/90 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">

                <button
                  type="button"
                  onClick={
                    toggleMute
                  }
                  title={
                    isMuted
                      ? 'Ativar áudio'
                      : 'Silenciar'
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line-soft bg-bg-mid/30 text-sm text-text-main transition hover:border-accent-hot/40 hover:text-accent-hot"
                >
                  {isMuted
                    ? '🔇'
                    : '🔊'}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={
                    0.01
                  }
                  value={
                    volume
                  }
                  onChange={
                    changeVolume
                  }
                  className="min-w-0 flex-1 cursor-pointer accent-pink-500"
                  aria-label="Volume"
                />

                <button
                  type="button"
                  onClick={
                    toggleFullscreen
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line-soft bg-bg-mid/30 text-sm text-text-main transition hover:border-accent-hot/40 hover:text-accent-hot"
                  title="Tela cheia"
                >
                  ⛶
                </button>

                <button
                  type="button"
                  onClick={
                    stopWatching
                  }
                  className="shrink-0 rounded-xl border border-red-400/30 bg-red-500/[0.06] px-3 py-2.5 text-[0.52rem] font-bold uppercase tracking-[0.09em] text-red-300 transition hover:bg-red-500/15"
                >
                  sair da live
                </button>

              </div>
            )}

            {/* EMPTY STATE */}
            {!watchingId && (
              <div className="relative z-[2] mx-auto max-w-[500px] px-8 text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-line-soft bg-bg-mid/25 text-3xl text-text-dim shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                  ▣
                </div>

                {liveParticipants.length ===
                0 ? (
                  <>
                    <p className="mt-6 text-[0.55rem] font-bold uppercase tracking-[0.2em] text-accent-hot">
                      aguardando transmissão
                    </p>

                    <h1 className="mt-2 font-display text-[2.2rem] text-text-main">
                      Nenhuma transmissão ativa
                    </h1>

                    <p className="mx-auto mt-3 max-w-[410px] text-[0.76rem] leading-relaxed text-text-dim">
                      Quando alguém começar a compartilhar a tela,
                      a transmissão aparecerá na lista de participantes.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-6 text-[0.55rem] font-bold uppercase tracking-[0.2em] text-accent-hot">
                      transmissão disponível
                    </p>

                    <h1 className="mt-2 font-display text-[2.2rem] text-text-main">
                      Escolha quem assistir
                    </h1>

                    <p className="mx-auto mt-3 max-w-[410px] text-[0.76rem] leading-relaxed text-text-dim">
                      {liveParticipants.length ===
                      1
                        ? 'Existe uma pessoa transmitindo agora.'
                        : `Existem ${liveParticipants.length} pessoas transmitindo agora.`}
                    </p>
                  </>
                )}

                {isSharing && (
                  <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-accent-hot/30 bg-accent-hot/[0.07] px-4 py-2 text-[0.52rem] font-bold uppercase tracking-[0.12em] text-accent-hot">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-accent-hot" />

                    você está ao vivo
                  </div>
                )}

              </div>
            )}

          </section>

          {/* SIDEBAR */}
          <aside className="border-t border-line-soft bg-bg-mid/35 lg:border-l lg:border-t-0">

            <div className="border-b border-line-soft px-5 py-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.2em] text-accent-hot">
                    sala privada
                  </p>

                  <h2 className="mt-1 font-display text-xl text-text-main">
                    Participantes
                  </h2>
                </div>

                <span className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-line-soft bg-bg-deep/30 px-2 text-[0.68rem] font-bold text-text-main">
                  {
                    participants.length
                  }
                </span>

              </div>

              {liveParticipants.length >
                0 && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-accent-hot/20 bg-accent-hot/[0.05] px-3 py-2">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-accent-hot" />

                  <span className="text-[0.52rem] font-bold uppercase tracking-[0.12em] text-accent-hot">
                    {
                      liveParticipants.length
                    }{' '}
                    {liveParticipants.length ===
                    1
                      ? 'live ativa'
                      : 'lives ativas'}
                  </span>

                </div>
              )}

            </div>

            <div className="max-h-[610px] space-y-2 overflow-y-auto p-4">

              {participants.map(
                (
                  participant,
                ) => {
                  const isMe =
                    participant.id ===
                    participantId;

                  const isWatching =
                    participant.id ===
                    watchingId;

                  return (
                    <article
                      key={
                        participant.id
                      }
                      className={`rounded-2xl border p-3 transition ${
                        isWatching
                          ? 'border-accent-hot/60 bg-accent-hot/[0.05] shadow-[0_0_25px_rgba(255,61,129,0.07)]'
                          : participant.isSharing
                            ? 'border-accent-hot/25 bg-bg-deep/35'
                            : 'border-line-soft bg-bg-deep/25 hover:border-accent-hot/25'
                      }`}
                    >

                      <div className="flex items-center gap-3">

                        <div className="relative">

                          <UserAvatar
                            image={
                              participant.image
                            }
                            name={
                              participant.name
                            }
                            size={
                              42
                            }
                          />

                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg-deep bg-emerald-400" />

                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex min-w-0 items-center gap-2">

                            <p className="truncate text-[0.74rem] font-semibold text-text-main">
                              {
                                participant.name
                              }
                            </p>

                            {isMe && (
                              <span className="shrink-0 text-[0.46rem] uppercase tracking-[0.1em] text-text-dim">
                                você
                              </span>
                            )}

                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2">

                            {participant.isOwner && (
                              <span className="rounded-full border border-yellow-400/20 bg-yellow-400/[0.05] px-2 py-0.5 text-[0.43rem] font-bold uppercase tracking-[0.08em] text-yellow-200">
                                dono
                              </span>
                            )}

                            {participant.isSharing && (
                              <span className="flex items-center gap-1 rounded-full border border-accent-hot/25 bg-accent-hot/[0.06] px-2 py-0.5 text-[0.43rem] font-bold uppercase tracking-[0.08em] text-accent-hot">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-hot" />

                                live
                              </span>
                            )}

                            {!participant.isSharing && (
                              <span className="text-[0.46rem] text-text-dim">
                                online
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                      {participant.isSharing &&
                        !isMe && (
                          <button
                            type="button"
                            onClick={() =>
                              watchStreamer(
                                participant.id,
                              )
                            }
                            className={`mt-3 flex min-h-9 w-full items-center justify-center rounded-xl border px-3 py-2 text-[0.5rem] font-bold uppercase tracking-[0.1em] transition ${
                              isWatching
                                ? 'border-accent-hot bg-accent-hot text-bg-deep'
                                : 'border-accent-hot/30 bg-accent-hot/[0.05] text-accent-hot hover:bg-accent-hot hover:text-bg-deep'
                            }`}
                          >
                            {isWatching
                              ? 'assistindo agora'
                              : 'assistir transmissão'}
                          </button>
                        )}

                    </article>
                  );
                },
              )}

            </div>

          </aside>

        </div>

        <footer className="mt-4 text-center">
          <span className="text-[0.48rem] font-bold uppercase tracking-[0.2em] text-text-dim/30">
            Grudge • sessão privada
          </span>
        </footer>

      </div>
    </main>
  );
}