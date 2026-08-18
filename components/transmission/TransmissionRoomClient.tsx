'use client';

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
  name: string;
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
  isOwner: boolean;
};

const ICE_SERVERS: RTCIceServer[] = [
  {
    urls: 'stun:stun.cloudflare.com:3478',
  },
];

export default function TransmissionRoomClient({
  code,
  name,
  isOwner,
}: TransmissionRoomClientProps) {
  const [participants, setParticipants] =
    useState<Participant[]>([]);

  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState<
    'connecting' | 'connected' | 'error'
  >('connecting');

  const [isSharing, setIsSharing] =
    useState(false);

  const [watchingId, setWatchingId] =
    useState<string | null>(null);

  const [volume, setVolume] =
    useState(1);

  const [isMuted, setIsMuted] =
    useState(false);

  const localStreamRef =
    useRef<MediaStream | null>(null);

  const remoteVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const outgoingPeersRef =
    useRef<
      Map<string, RTCPeerConnection>
    >(new Map());

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
    >(new Map());

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
    peer.onicecandidate = null;
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
      (peer, viewerId) => {
        peer.ontrack = null;
        peer.onicecandidate = null;
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
      current.peer.ontrack = null;
      current.peer.onicecandidate =
        null;
      current.peer.onconnectionstatechange =
        null;

      current.peer.close();

      pendingIceRef.current.delete(
        current.streamerId,
      );
    }

    incomingPeerRef.current = null;

    if (remoteVideoRef.current) {
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
      type: 'broadcast',
      event: 'webrtc-signal',
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
      id: participantId,
      name,
      isOwner,
      isSharing: sharing,
      joinedAt:
        new Date().toISOString(),
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
        iceServers: ICE_SERVERS,
      });

    peer.onicecandidate = (
      event,
    ) => {
      if (!event.candidate) {
        return;
      }

      void sendSignal({
        type: 'ice-candidate',
        senderId: participantId,
        targetId: viewerId,
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
        iceServers: ICE_SERVERS,
      });

    peer.onicecandidate = (
      event,
    ) => {
      if (!event.candidate) {
        return;
      }

      void sendSignal({
        type: 'ice-candidate',
        senderId: participantId,
        targetId: streamerId,
        candidate:
          event.candidate.toJSON(),
      });
    };

    peer.ontrack = (event) => {
      const [stream] =
        event.streams;

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
        .catch((error) => {
          console.warn(
            '[WEBRTC] Autoplay bloqueado:',
            error,
          );
        });
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

          setWatchingId(null);
        }
      };

    incomingPeerRef.current = {
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
      .forEach((track) => {
        const alreadyAdded =
          senders.some(
            (sender) =>
              sender.track?.id ===
              track.id,
          );

        if (alreadyAdded) {
          return;
        }

        peer.addTrack(
          track,
          stream,
        );
      });
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

    for (const candidate of pending) {
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

    if (!peer.localDescription) {
      return;
    }

    await sendSignal({
      type: 'offer',
      senderId: participantId,
      targetId: viewerId,
      sdp: peer.localDescription,
    });
  }

  async function handleOffer(
    streamerId: string,
    sdp:
      RTCSessionDescriptionInit,
  ) {
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

    if (!peer.localDescription) {
      return;
    }

    await sendSignal({
      type: 'answer',
      senderId: participantId,
      targetId: streamerId,
      sdp: peer.localDescription,
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

        pending.push(candidate);

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
        !incoming.peer
          .remoteDescription
      ) {
        const pending =
          pendingIceRef.current.get(
            senderId,
          ) ?? [];

        pending.push(candidate);

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

    pending.push(candidate);

    pendingIceRef.current.set(
      senderId,
      pending,
    );
  }

  async function startScreenShare() {
    if (isSharing) {
      return;
    }

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getDisplayMedia
      ) {
        console.error(
          '[TRANSMISSÃO] Este navegador não suporta compartilhamento de tela.',
        );

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

            audio: true,
          });

      const videoTracks =
        stream.getVideoTracks();

      if (
        videoTracks.length === 0
      ) {
        stream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        console.warn(
          '[TRANSMISSÃO] Nenhuma tela foi selecionada.',
        );

        return;
      }

      localStreamRef.current =
        stream;

      setIsSharing(true);

      await updatePresence(true);

      const videoTrack =
        videoTracks[0];

      videoTrack.onended = () => {
        void stopScreenShare();
      };

      console.log(
        '[TRANSMISSÃO] Compartilhamento iniciado.',
        {
          video:
            stream
              .getVideoTracks()
              .length,

          audio:
            stream
              .getAudioTracks()
              .length,
        },
      );
    } catch (error) {
      if (
        error instanceof DOMException
      ) {
        if (
          error.name ===
          'NotAllowedError'
        ) {
          console.log(
            '[TRANSMISSÃO] Compartilhamento não autorizado ou cancelado pelo usuário.',
          );

          return;
        }

        if (
          error.name ===
          'NotFoundError'
        ) {
          console.warn(
            '[TRANSMISSÃO] Nenhuma tela, janela ou aba disponível para compartilhar.',
          );

          return;
        }

        if (
          error.name ===
          'InvalidStateError'
        ) {
          console.warn(
            '[TRANSMISSÃO] O compartilhamento precisa ser iniciado diretamente por um clique do usuário.',
          );

          return;
        }
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
        .forEach((track) => {
          track.onended = null;
          track.stop();
        });
    }

    localStreamRef.current = null;

    closeAllOutgoingPeers();

    setIsSharing(false);

    await updatePresence(false);
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

    if (
      watchingId &&
      watchingId !== streamerId
    ) {
      await sendSignal({
        type: 'watch-stopped',
        senderId: participantId,
        targetId: watchingId,
      });
    }

    closeIncomingPeer();

    setWatchingId(streamerId);

    createIncomingPeer(
      streamerId,
    );

    await sendSignal({
      type: 'watch-request',
      senderId: participantId,
      targetId: streamerId,
    });
  }

  async function stopWatching() {
    if (watchingId) {
      await sendSignal({
        type: 'watch-stopped',
        senderId: participantId,
        targetId: watchingId,
      });
    }

    closeIncomingPeer();

    setWatchingId(null);
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

    setVolume(value);

    const video =
      remoteVideoRef.current;

    if (!video) {
      return;
    }

    video.volume = value;

    if (value === 0) {
      video.muted = true;

      setIsMuted(true);

      return;
    }

    if (video.muted) {
      video.muted = false;

      setIsMuted(false);
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
    } catch (error) {
      console.error(
        '[TRANSMISSÃO] Erro ao copiar convite:',
        error,
      );
    }
  }

  useEffect(() => {
    const supabase =
      getSupabaseBrowser();

    const channel =
      supabase.channel(
        `transmission:${normalizedCode}`,
        {
          config: {
            private: false,

            presence: {
              key: participantId,
            },

            broadcast: {
              self: false,
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

      Object.entries(state).forEach(
        ([
          presenceKey,
          entries,
        ]) => {
          entries.forEach(
            (entry) => {
              const data =
                entry as unknown as {
                  id?: string;
                  name?: string;
                  isOwner?: boolean;
                  isSharing?: boolean;
                  joinedAt?: string;
                };

              if (!data.name) {
                return;
              }

              nextParticipants.push({
                id:
                  data.id ??
                  presenceKey,

                name: data.name,

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
              (participant) => [
                participant.id,
                participant,
              ],
            ),
          ).values(),
        );

      unique.sort((a, b) => {
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
      });

      setParticipants(unique);
    }

    channel.on(
      'presence',
      {
        event: 'sync',
      },
      syncParticipants,
    );

    channel.on(
      'presence',
      {
        event: 'join',
      },
      syncParticipants,
    );

    channel.on(
      'presence',
      {
        event: 'leave',
      },
      syncParticipants,
    );

    channel.on(
      'broadcast',
      {
        event: 'webrtc-signal',
      },
      async ({ payload }) => {
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
          switch (signal.type) {
            case 'watch-request':
              if (
                localStreamRef.current
              ) {
                await handleWatchRequest(
                  signal.senderId,
                );
              }
              break;

            case 'watch-stopped':
              closeOutgoingPeer(
                signal.senderId,
              );
              break;

            case 'offer':
              await handleOffer(
                signal.senderId,
                signal.sdp,
              );
              break;

            case 'answer':
              await handleAnswer(
                signal.senderId,
                signal.sdp,
              );
              break;

            case 'ice-candidate':
              await handleIceCandidate(
                signal.senderId,
                signal.candidate,
              );
              break;
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
      async (status, error) => {
        if (
          status ===
          'SUBSCRIBED'
        ) {
          setConnectionStatus(
            'connected',
          );

          await channel.track({
            id: participantId,
            name,
            isOwner,
            isSharing: false,
            joinedAt:
              new Date()
                .toISOString(),
          });

          return;
        }

        if (
          status ===
            'CHANNEL_ERROR' ||
          status === 'TIMED_OUT'
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
          .forEach((track) => {
            track.onended = null;
            track.stop();
          });
      }

      closeAllOutgoingPeers();
      closeIncomingPeer();

      void channel.untrack();

      void supabase.removeChannel(
        channel,
      );

      channelRef.current = null;
    };
  }, [
    normalizedCode,
    participantId,
    name,
    isOwner,
  ]);

  const statusLabel =
    connectionStatus === 'connected'
      ? 'conectado'
      : connectionStatus === 'error'
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
    <main className="relative z-[1] min-h-screen px-4 pb-8 pt-[100px] sm:px-6">
      <div className="mx-auto max-w-[1450px]">
        {/* CABEÇALHO */}
        <header className="mb-4 flex flex-col gap-3 rounded-[18px] border border-line-soft bg-bg-mid/30 px-5 py-4 backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg border border-accent-hot/30 bg-accent-hot/[0.08] px-3 py-2 font-mono text-[0.72rem] font-bold tracking-[0.18em] text-accent-hot">
              {normalizedCode}
            </span>

            <span className="text-[0.75rem] text-text-main">
              {name}
            </span>

            {isOwner && (
              <span className="rounded-full border border-accent-hot/30 px-2.5 py-1 text-[0.5rem] font-bold uppercase tracking-[0.12em] text-accent-hot">
                dono
              </span>
            )}

            <span className="flex items-center gap-2 text-[0.65rem] text-text-dim">
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionStatus ===
                  'connected'
                    ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]'
                    : connectionStatus ===
                        'error'
                      ? 'bg-red-400'
                      : 'animate-pulse bg-yellow-300'
                }`}
              />

              {statusLabel}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isSharing ? (
              <button
                type="button"
                onClick={
                  startScreenShare
                }
                className="rounded-xl bg-accent-hot px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-bg-deep transition hover:-translate-y-0.5 hover:brightness-110"
              >
                compartilhar tela
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  stopScreenShare
                }
                className="rounded-xl border border-red-400/40 bg-red-500/[0.08] px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-red-300 transition hover:bg-red-500/15"
              >
                parar transmissão
              </button>
            )}

            <button
              type="button"
              onClick={copyInvite}
              className="rounded-xl border border-line-soft px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-text-dim transition hover:border-accent-hot/50 hover:text-accent-hot"
            >
              copiar convite
            </button>
          </div>
        </header>

        {/* SALA */}
        <div className="grid min-h-[650px] overflow-hidden rounded-[22px] border border-line-soft bg-bg-mid/25 lg:grid-cols-[1fr_300px]">
          {/* VÍDEO */}
          <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-black/90">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className={`absolute inset-0 h-full w-full object-contain ${
                watchingId
                  ? 'block'
                  : 'hidden'
              }`}
            />

            {watchingParticipant && (
              <div className="absolute left-4 top-4 z-[3] flex items-center gap-2 rounded-xl border border-line-soft bg-bg-deep/80 px-3 py-2 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-accent-hot shadow-[0_0_10px_rgba(255,61,129,0.7)]" />

                <span className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-text-main">
                  assistindo{' '}
                  {watchingParticipant.name}
                </span>
              </div>
            )}

            {watchingId && (
              <div className="absolute bottom-4 left-1/2 z-[5] flex w-[calc(100%-2rem)] max-w-[620px] -translate-x-1/2 items-center gap-3 rounded-2xl border border-line-soft bg-bg-deep/85 px-4 py-3 shadow-[0_15px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <button
                  type="button"
                  onClick={toggleMute}
                  title={
                    isMuted
                      ? 'Ativar áudio'
                      : 'Silenciar'
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line-soft text-text-main transition hover:border-accent-hot/50 hover:text-accent-hot"
                >
                  {isMuted
                    ? '🔇'
                    : '🔊'}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={
                    changeVolume
                  }
                  aria-label="Volume da transmissão"
                  className="min-w-0 flex-1 cursor-pointer accent-pink-500"
                />

                <button
                  type="button"
                  onClick={
                    toggleFullscreen
                  }
                  title="Tela cheia"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line-soft text-text-main transition hover:border-accent-hot/50 hover:text-accent-hot"
                >
                  ⛶
                </button>

                <button
                  type="button"
                  onClick={
                    stopWatching
                  }
                  className="shrink-0 rounded-xl border border-red-400/30 bg-red-500/[0.06] px-3 py-2 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-red-300 transition hover:bg-red-500/15"
                >
                  sair da live
                </button>
              </div>
            )}

            {!watchingId && (
              <div className="relative z-[1] p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-line-soft text-3xl text-text-dim">
                  ▣
                </div>

                {liveParticipants.length ===
                0 ? (
                  <>
                    <h1 className="mt-5 font-display text-3xl text-text-main">
                      Nenhuma transmissão ativa.
                    </h1>

                    <p className="mx-auto mt-3 max-w-[460px] text-[0.78rem] leading-relaxed text-text-dim">
                      Quando alguém compartilhar a tela,
                      a transmissão aparecerá na lista ao lado.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="mt-5 font-display text-3xl text-text-main">
                      Escolha uma transmissão.
                    </h1>

                    <p className="mx-auto mt-3 max-w-[460px] text-[0.78rem] leading-relaxed text-text-dim">
                      Existem{' '}
                      {liveParticipants.length}{' '}
                      {liveParticipants.length ===
                      1
                        ? 'transmissão ativa'
                        : 'transmissões ativas'}
                      .
                    </p>
                  </>
                )}

                {isSharing && (
                  <div className="mx-auto mt-5 inline-flex rounded-full border border-accent-hot/30 bg-accent-hot/[0.08] px-4 py-2 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-accent-hot">
                    você está transmitindo
                  </div>
                )}
              </div>
            )}
          </section>

          {/* PARTICIPANTES */}
          <aside className="border-t border-line-soft bg-bg-mid/30 p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-accent-hot">
                  na sala
                </p>

                <p className="mt-1 text-[0.65rem] text-text-dim">
                  {participants.length}{' '}
                  {participants.length ===
                  1
                    ? 'pessoa'
                    : 'pessoas'}
                </p>
              </div>

              <span className="flex h-8 min-w-8 items-center justify-center rounded-full border border-line-soft bg-bg-deep/30 px-2 text-[0.65rem] font-bold text-text-main">
                {participants.length}
              </span>
            </div>

            {liveParticipants.length >
              0 && (
              <div className="mt-5 rounded-xl border border-accent-hot/20 bg-accent-hot/[0.04] px-3 py-2.5">
                <p className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-accent-hot">
                  {liveParticipants.length}{' '}
                  {liveParticipants.length ===
                  1
                    ? 'live ativa'
                    : 'lives ativas'}
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              {participants.map(
                (participant) => {
                  const isMe =
                    participant.id ===
                    participantId;

                  const isWatching =
                    participant.id ===
                    watchingId;

                  return (
                    <div
                      key={
                        participant.id
                      }
                      className={`rounded-xl border bg-bg-deep/30 px-3 py-3 transition ${
                        isWatching
                          ? 'border-accent-hot/60'
                          : 'border-line-soft'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,0.65)]" />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.76rem] text-text-main">
                            {
                              participant.name
                            }
                          </p>

                          <p className="mt-0.5 text-[0.55rem] uppercase tracking-[0.11em] text-text-dim">
                            {participant.isOwner
                              ? 'dono da sala'
                              : 'participante'}
                          </p>
                        </div>

                        {isMe && (
                          <span className="rounded-full border border-line-soft px-2 py-1 text-[0.48rem] font-bold uppercase tracking-[0.1em] text-text-dim">
                            você
                          </span>
                        )}

                        {participant.isSharing && (
                          <span className="rounded-full border border-accent-hot/30 bg-accent-hot/[0.08] px-2 py-1 text-[0.48rem] font-bold uppercase tracking-[0.1em] text-accent-hot">
                            live
                          </span>
                        )}
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
                            className={`mt-3 w-full rounded-lg border px-3 py-2 text-[0.55rem] font-bold uppercase tracking-[0.1em] transition ${
                              isWatching
                                ? 'border-accent-hot bg-accent-hot text-bg-deep'
                                : 'border-accent-hot/30 bg-accent-hot/[0.06] text-accent-hot hover:bg-accent-hot hover:text-bg-deep'
                            }`}
                          >
                            {isWatching
                              ? 'assistindo agora'
                              : 'assistir transmissão'}
                          </button>
                        )}
                    </div>
                  );
                },
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}