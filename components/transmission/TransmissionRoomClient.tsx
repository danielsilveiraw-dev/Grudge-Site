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

type UiSound =
  | 'join'
  | 'leave'
  | 'mute'
  | 'unmute'
  | 'watch-start'
  | 'watch-stop';

const ROOM_SOUNDS: Record<UiSound, string> = {
  join: '/sounds/transmission/join.mp3',
  leave: '/sounds/transmission/leave.mp3',
  mute: '/sounds/transmission/mute.mp3',
  unmute: '/sounds/transmission/unmute.mp3',
  'watch-start': '/sounds/transmission/watch-start.mp3',
  'watch-stop': '/sounds/transmission/watch-stop.mp3',
};

type Participant = {
  id: string;
  discordId: string;
  name: string;
  image: string | null;
  isOwner: boolean;
  isSharing: boolean;
  voiceReady: boolean;
  micEnabled: boolean;
  deafened: boolean;
  isSpeaking: boolean;
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

type VoiceSignalPayload =
  | {
      type: 'voice-offer';
      senderId: string;
      targetId: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: 'voice-answer';
      senderId: string;
      targetId: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: 'voice-ice';
      senderId: string;
      targetId: string;
      candidate: RTCIceCandidateInit;
    }
  | {
      type: 'voice-leave';
      senderId: string;
      targetId: string;
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

  const [
    voiceReady,
    setVoiceReady,
  ] = useState(false);

  const [
    micEnabled,
    setMicEnabled,
  ] = useState(true);

  const [
    deafened,
    setDeafened,
  ] = useState(false);

  const [
    voiceError,
    setVoiceError,
  ] = useState<string | null>(
    null,
  );

  const [
    localSpeaking,
    setLocalSpeaking,
  ] = useState(false);

  const [
    reconnectingVoice,
    setReconnectingVoice,
  ] = useState(false);

  const watchingIdRef =
    useRef<string | null>(
      null,
    );

  const isSharingRef =
    useRef(false);

  const voiceReadyRef =
    useRef(false);

  const micEnabledRef =
    useRef(true);

  const deafenedRef =
    useRef(false);

  const localSpeakingRef =
    useRef(false);

  const reconnectingVoiceRef =
    useRef(false);

  const speakingMonitorRef =
    useRef<{
      audioContext: AudioContext;
      analyser: AnalyserNode;
      source: MediaStreamAudioSourceNode;
      frameId: number;
      lastPresenceUpdate: number;
    } | null>(null);

  const voiceStreamRef =
    useRef<MediaStream | null>(
      null,
    );

  const voicePeersRef =
    useRef<
      Map<
        string,
        RTCPeerConnection
      >
    >(
      new Map(),
    );

  const voicePendingIceRef =
    useRef<
      Map<
        string,
        RTCIceCandidateInit[]
      >
    >(
      new Map(),
    );

  const remoteAudioElementsRef =
    useRef<
      Map<
        string,
        HTMLAudioElement
      >
    >(
      new Map(),
    );

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

  const soundsUnlockedRef =
    useRef(false);

  const knownParticipantIdsRef =
    useRef<Set<string>>(
      new Set(),
    );

  const presenceInitializedRef =
    useRef(false);

  const lastSoundAtRef =
    useRef<
      Partial<
        Record<
          UiSound,
          number
        >
      >
    >({});

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

  function playUiSound(
    sound: UiSound,
  ) {
    if (
      typeof window === 'undefined' ||
      !soundsUnlockedRef.current
    ) {
      return;
    }

    const now =
      Date.now();

    const last =
      lastSoundAtRef.current[
        sound
      ] ?? 0;

    const cooldown =
      sound === 'join' ||
      sound === 'leave'
        ? 900
        : 250;

    if (
      now - last <
      cooldown
    ) {
      return;
    }

    lastSoundAtRef.current[
      sound
    ] = now;

    try {
      const audio =
        new Audio(
          ROOM_SOUNDS[sound],
        );

      audio.volume = 0.32;
      audio.currentTime = 0;

      void audio.play().catch(
        () => {
          // O navegador pode bloquear
          // áudio sem interação prévia.
        },
      );
    } catch {
      // O som é apenas feedback da interface.
    }
  }

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

      voiceReady:
        voiceReadyRef.current,

      micEnabled:
        micEnabledRef.current,

      deafened:
        deafenedRef.current,

      isSpeaking:
        localSpeakingRef.current,

      joinedAt:
        new Date()
          .toISOString(),
    });
  }

  function stopSpeakingMonitor() {
    const monitor =
      speakingMonitorRef.current;

    if (monitor) {
      cancelAnimationFrame(
        monitor.frameId,
      );

      monitor.source.disconnect();
      monitor.analyser.disconnect();

      void monitor.audioContext.close();

      speakingMonitorRef.current =
        null;
    }

    localSpeakingRef.current =
      false;

    setLocalSpeaking(
      false,
    );
  }

  function startSpeakingMonitor(
    stream: MediaStream,
  ) {
    stopSpeakingMonitor();

    const audioContext =
      new AudioContext();

    const analyser =
      audioContext.createAnalyser();

    analyser.fftSize =
      512;

    analyser.smoothingTimeConstant =
      0.72;

    const source =
      audioContext.createMediaStreamSource(
        stream,
      );

    source.connect(
      analyser,
    );

    const buffer =
      new Uint8Array(
        analyser.fftSize,
      );

    const monitor = {
      audioContext,
      analyser,
      source,
      frameId: 0,
      lastPresenceUpdate: 0,
    };

    speakingMonitorRef.current =
      monitor;

    const tick =
      () => {
        if (
          speakingMonitorRef.current !==
          monitor
        ) {
          return;
        }

        analyser.getByteTimeDomainData(
          buffer,
        );

        let sumSquares =
          0;

        for (
          let index = 0;
          index < buffer.length;
          index++
        ) {
          const normalized =
            (
              buffer[index] -
              128
            ) /
            128;

          sumSquares +=
            normalized *
            normalized;
        }

        const rms =
          Math.sqrt(
            sumSquares /
              buffer.length,
          );

        const nextSpeaking =
          voiceReadyRef.current &&
          micEnabledRef.current &&
          rms > 0.035;

        if (
          nextSpeaking !==
          localSpeakingRef.current
        ) {
          localSpeakingRef.current =
            nextSpeaking;

          setLocalSpeaking(
            nextSpeaking,
          );

          const now =
            Date.now();

          if (
            now -
              monitor.lastPresenceUpdate >
            120
          ) {
            monitor.lastPresenceUpdate =
              now;

            void updatePresence(
              isSharingRef.current,
            );
          }
        }

        monitor.frameId =
          requestAnimationFrame(
            tick,
          );
      };

    monitor.frameId =
      requestAnimationFrame(
        tick,
      );
  }

  async function sendVoiceSignal(
    payload: VoiceSignalPayload,
  ) {
    const channel =
      channelRef.current;

    if (!channel) {
      return;
    }

    await channel.send({
      type: 'broadcast',
      event: 'voice-signal',
      payload,
    });
  }

  function removeRemoteAudio(
    remoteId: string,
  ) {
    const audio =
      remoteAudioElementsRef.current.get(
        remoteId,
      );

    if (audio) {
      audio.pause();
      audio.srcObject =
        null;
      audio.remove();

      remoteAudioElementsRef.current.delete(
        remoteId,
      );
    }
  }

  function closeVoicePeer(
    remoteId: string,
  ) {
    const peer =
      voicePeersRef.current.get(
        remoteId,
      );

    if (peer) {
      peer.ontrack =
        null;
      peer.onicecandidate =
        null;
      peer.onconnectionstatechange =
        null;

      peer.close();

      voicePeersRef.current.delete(
        remoteId,
      );
    }

    voicePendingIceRef.current.delete(
      remoteId,
    );

    removeRemoteAudio(
      remoteId,
    );
  }

  function closeAllVoicePeers() {
    Array.from(
      voicePeersRef.current.keys(),
    ).forEach(
      (remoteId) => {
        closeVoicePeer(
          remoteId,
        );
      },
    );
  }

  function createVoicePeer(
    remoteId: string,
  ) {
    const existing =
      voicePeersRef.current.get(
        remoteId,
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
      closeVoicePeer(
        remoteId,
      );
    }

    const peer =
      new RTCPeerConnection({
        iceServers:
          ICE_SERVERS,
      });

    const stream =
      voiceStreamRef.current;

    if (stream) {
      stream
        .getAudioTracks()
        .forEach(
          (track) => {
            const alreadyAdded =
              peer
                .getSenders()
                .some(
                  (sender) =>
                    sender.track?.id ===
                    track.id,
                );

            if (!alreadyAdded) {
              peer.addTrack(
                track,
                stream,
              );
            }
          },
        );
    }

    peer.onicecandidate =
      (event) => {
        if (
          !event.candidate
        ) {
          return;
        }

        void sendVoiceSignal({
          type:
            'voice-ice',

          senderId:
            participantId,

          targetId:
            remoteId,

          candidate:
            event.candidate.toJSON(),
        });
      };

    peer.ontrack =
      (event) => {
        const [
          remoteStream,
        ] = event.streams;

        if (!remoteStream) {
          return;
        }

        let audio =
          remoteAudioElementsRef.current.get(
            remoteId,
          );

        if (!audio) {
          audio =
            document.createElement(
              'audio',
            );

          audio.autoplay =
            true;

          audio.dataset.voiceParticipant =
            remoteId;

          document.body.appendChild(
            audio,
          );

          remoteAudioElementsRef.current.set(
            remoteId,
            audio,
          );
        }

        audio.srcObject =
          remoteStream;

        audio.muted =
          deafenedRef.current;

        audio.volume =
          1;

        void audio
          .play()
          .catch(
            (error) => {
              console.warn(
                '[VOZ] Autoplay bloqueado:',
                error,
              );
            },
          );
      };

    peer.onconnectionstatechange =
      () => {
        if (
          peer.connectionState ===
            'failed' ||
          peer.connectionState ===
            'closed'
        ) {
          closeVoicePeer(
            remoteId,
          );

          if (
            voiceReadyRef.current &&
            peer.connectionState ===
              'failed'
          ) {
            window.setTimeout(
              () => {
                void reconnectVoice();
              },
              900,
            );
          }
        }
      };

    voicePeersRef.current.set(
      remoteId,
      peer,
    );

    return peer;
  }

  async function flushVoiceIce(
    remoteId: string,
    peer: RTCPeerConnection,
  ) {
    const pending =
      voicePendingIceRef.current.get(
        remoteId,
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
          '[VOZ] ICE pendente inválido:',
          error,
        );
      }
    }

    voicePendingIceRef.current.delete(
      remoteId,
    );
  }

  async function createVoiceOffer(
    remoteId: string,
  ) {
    if (
      !voiceReadyRef.current
    ) {
      return;
    }

    const peer =
      createVoicePeer(
        remoteId,
      );

    if (
      peer.signalingState !==
      'stable'
    ) {
      return;
    }

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

    await sendVoiceSignal({
      type:
        'voice-offer',

      senderId:
        participantId,

      targetId:
        remoteId,

      sdp:
        peer.localDescription,
    });
  }

  async function handleVoiceOffer(
    remoteId: string,
    sdp:
      RTCSessionDescriptionInit,
  ) {
    if (
      !voiceReadyRef.current
    ) {
      return;
    }

    const peer =
      createVoicePeer(
        remoteId,
      );

    await peer.setRemoteDescription(
      new RTCSessionDescription(
        sdp,
      ),
    );

    await flushVoiceIce(
      remoteId,
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

    await sendVoiceSignal({
      type:
        'voice-answer',

      senderId:
        participantId,

      targetId:
        remoteId,

      sdp:
        peer.localDescription,
    });
  }

  async function handleVoiceAnswer(
    remoteId: string,
    sdp:
      RTCSessionDescriptionInit,
  ) {
    const peer =
      voicePeersRef.current.get(
        remoteId,
      );

    if (!peer) {
      return;
    }

    await peer.setRemoteDescription(
      new RTCSessionDescription(
        sdp,
      ),
    );

    await flushVoiceIce(
      remoteId,
      peer,
    );
  }

  async function handleVoiceIce(
    remoteId: string,
    candidate:
      RTCIceCandidateInit,
  ) {
    const peer =
      voicePeersRef.current.get(
        remoteId,
      );

    if (
      !peer ||
      !peer.remoteDescription
    ) {
      const pending =
        voicePendingIceRef.current.get(
          remoteId,
        ) ?? [];

      pending.push(
        candidate,
      );

      voicePendingIceRef.current.set(
        remoteId,
        pending,
      );

      return;
    }

    try {
      await peer.addIceCandidate(
        new RTCIceCandidate(
          candidate,
        ),
      );
    } catch (error) {
      console.warn(
        '[VOZ] ICE inválido:',
        error,
      );
    }
  }

  async function connectVoiceToParticipants(
    currentParticipants:
      Participant[],
  ) {
    if (
      !voiceReadyRef.current
    ) {
      return;
    }

    for (
      const participant of
      currentParticipants
    ) {
      if (
        participant.id ===
          participantId ||
        !participant.voiceReady
      ) {
        continue;
      }

      if (
        voicePeersRef.current.has(
          participant.id,
        )
      ) {
        continue;
      }

      /*
       * Só um dos dois lados cria
       * a oferta. Isso evita duas
       * offers simultâneas.
       */
      if (
        participantId <
        participant.id
      ) {
        try {
          await createVoiceOffer(
            participant.id,
          );
        } catch (error) {
          console.error(
            '[VOZ] Erro ao conectar com participante:',
            error,
          );
        }
      }
    }
  }

  async function reconnectVoice() {
    if (
      !voiceReadyRef.current ||
      reconnectingVoiceRef.current
    ) {
      return;
    }

    reconnectingVoiceRef.current =
      true;

    setReconnectingVoice(
      true,
    );

    try {
      closeAllVoicePeers();

      await new Promise<void>(
        (resolve) => {
          window.setTimeout(
            resolve,
            350,
          );
        },
      );

      await connectVoiceToParticipants(
        participants,
      );
    } catch (error) {
      console.error(
        '[VOZ] Falha ao reconectar:',
        error,
      );
    } finally {
      reconnectingVoiceRef.current =
        false;

      setReconnectingVoice(
        false,
      );
    }
  }

  async function startVoice() {
    soundsUnlockedRef.current =
      true;

    if (
      voiceReadyRef.current
    ) {
      return;
    }

    setVoiceError(
      null,
    );

    try {
      const stream =
        await navigator.mediaDevices
          .getUserMedia({
            audio: {
              echoCancellation:
                true,

              noiseSuppression:
                true,

              autoGainControl:
                true,
            },

            video:
              false,
          });

      voiceStreamRef.current =
        stream;

      voiceReadyRef.current =
        true;

      micEnabledRef.current =
        true;

      deafenedRef.current =
        false;

      stream
        .getAudioTracks()
        .forEach(
          (track) => {
            track.enabled =
              true;
          },
        );

      startSpeakingMonitor(
        stream,
      );

      setVoiceReady(
        true,
      );

      setMicEnabled(
        true,
      );

      setDeafened(
        false,
      );

      setParticipants(
        (current) =>
          current.map(
            (participant) =>
              participant.id ===
                participantId
                ? {
                    ...participant,
                    voiceReady:
                      true,
                    micEnabled:
                      true,
                    deafened:
                      false,
                  }
                : participant,
          ),
      );

      await updatePresence(
        isSharingRef.current,
      );

      await connectVoiceToParticipants(
        participants,
      );
    } catch (error) {
      if (
        error instanceof
          DOMException &&
        error.name ===
          'NotAllowedError'
      ) {
        setVoiceError(
          'Permissão do microfone negada.',
        );

        return;
      }

      console.error(
        '[VOZ] Erro ao iniciar microfone:',
        error,
      );

      setVoiceError(
        'Não foi possível iniciar o microfone.',
      );
    }
  }

  async function stopVoice() {
    if (
      !voiceReadyRef.current
    ) {
      return;
    }

    const currentPeers =
      Array.from(
        voicePeersRef.current.keys(),
      );

    for (
      const remoteId of
      currentPeers
    ) {
      void sendVoiceSignal({
        type:
          'voice-leave',

        senderId:
          participantId,

        targetId:
          remoteId,
      });
    }

    stopSpeakingMonitor();

    voiceStreamRef.current
      ?.getTracks()
      .forEach(
        (track) => {
          track.stop();
        },
      );

    voiceStreamRef.current =
      null;

    closeAllVoicePeers();

    voiceReadyRef.current =
      false;

    reconnectingVoiceRef.current =
      false;

    setReconnectingVoice(
      false,
    );

    micEnabledRef.current =
      true;

    deafenedRef.current =
      false;

    setVoiceReady(
      false,
    );

    setMicEnabled(
      true,
    );

    setDeafened(
      false,
    );

    setParticipants(
      (current) =>
        current.map(
          (participant) =>
            participant.id ===
              participantId
              ? {
                  ...participant,
                  voiceReady:
                    false,
                  micEnabled:
                    true,
                  deafened:
                    false,
                  isSpeaking:
                    false,
                }
              : participant,
        ),
    );

    await updatePresence(
      isSharingRef.current,
    );
  }

  async function toggleMicrophone() {
    soundsUnlockedRef.current =
      true;

    if (
      !voiceReadyRef.current
    ) {
      await startVoice();
      return;
    }

    /*
     * Se estiver ensurdecido, falar novamente
     * também reativa o áudio recebido.
     * Isso evita deixar o estado de voz preso
     * e mantém os efeitos sonoros funcionando.
     */
    if (
      deafenedRef.current
    ) {
      deafenedRef.current =
        false;

      setDeafened(
        false,
      );

      remoteAudioElementsRef.current.forEach(
        (audio) => {
          audio.muted =
            false;

          audio.volume =
            1;
        },
      );
    }

    const next =
      !micEnabledRef.current;

    micEnabledRef.current =
      next;

    voiceStreamRef.current
      ?.getAudioTracks()
      .forEach(
        (track) => {
          track.enabled =
            next;
        },
      );

    setMicEnabled(
      next,
    );

    setParticipants(
      (current) =>
        current.map(
          (participant) =>
            participant.id ===
              participantId
              ? {
                  ...participant,
                  micEnabled:
                    next,
                  voiceReady:
                    true,
                  deafened:
                    false,
                }
              : participant,
        ),
    );

    playUiSound(
      next
        ? 'unmute'
        : 'mute',
    );

    if (!next) {
      setLocalSpeaking(
        false,
      );
    }

    await updatePresence(
      isSharingRef.current,
    );
  }

  async function toggleDeafen() {
    soundsUnlockedRef.current =
      true;

    if (
      !voiceReadyRef.current
    ) {
      await startVoice();
      return;
    }

    const next =
      !deafenedRef.current;

    deafenedRef.current =
      next;

    setDeafened(
      next,
    );

    /*
     * Ensurdecer controla apenas o áudio
     * recebido. Não altera o estado real
     * do microfone.
     */
    remoteAudioElementsRef.current.forEach(
      (audio) => {
        audio.muted =
          next;

        audio.volume =
          next
            ? 0
            : 1;
      },
    );

    setParticipants(
      (current) =>
        current.map(
          (participant) =>
            participant.id ===
              participantId
              ? {
                  ...participant,
                  deafened:
                    next,
                  micEnabled:
                    micEnabledRef.current,
                  voiceReady:
                    true,
                }
              : participant,
        ),
    );

    await updatePresence(
      isSharingRef.current,
    );
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

    playUiSound(
      'watch-start',
    );

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
    soundsUnlockedRef.current =
      true;

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

    if (
      watchingIdRef.current ===
      participantId
    ) {
      if (
        remoteVideoRef.current
      ) {
        remoteVideoRef.current.srcObject =
          null;
      }

      watchingIdRef.current =
        null;

      setWatchingId(
        null,
      );
    }

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
    soundsUnlockedRef.current =
      true;

    if (
      streamerId ===
      participantId
    ) {
      const stream =
        localStreamRef.current;

      if (
        !stream ||
        !remoteVideoRef.current
      ) {
        return;
      }

      closeIncomingPeer();

      watchingIdRef.current =
        participantId;

      setWatchingId(
        participantId,
      );

      const video =
        remoteVideoRef.current;

      video.srcObject =
        stream;

      video.muted =
        true;

      setIsMuted(
        true,
      );

      void video
        .play()
        .catch(
          () => {},
        );

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
      currentWatchingId &&
      currentWatchingId !==
        participantId
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

    if (
      currentWatchingId ===
      participantId
    ) {
      if (
        remoteVideoRef.current
      ) {
        remoteVideoRef.current.srcObject =
          null;
      }
    } else {
      closeIncomingPeer();
    }

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
    const preloadedSounds =
      Object.values(
        ROOM_SOUNDS,
      ).map(
        (path) => {
          const audio =
            new Audio(path);

          audio.preload =
            'auto';

          audio.volume =
            0.32;

          audio.load();

          return audio;
        },
      );

    const unlockSounds =
      () => {
        soundsUnlockedRef.current =
          true;
      };

    window.addEventListener(
      'pointerdown',
      unlockSounds,
      {
        passive:
          true,
      },
    );

    window.addEventListener(
      'keydown',
      unlockSounds,
    );

    window.addEventListener(
      'touchstart',
      unlockSounds,
      {
        passive:
          true,
      },
    );

    return () => {
      window.removeEventListener(
        'pointerdown',
        unlockSounds,
      );

      window.removeEventListener(
        'keydown',
        unlockSounds,
      );

      window.removeEventListener(
        'touchstart',
        unlockSounds,
      );

      preloadedSounds.forEach(
        (audio) => {
          audio.pause();
          audio.src = '';
        },
      );
    };
  }, []);

  useEffect(() => {
    presenceInitializedRef.current =
      false;

    knownParticipantIdsRef.current =
      new Set();

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
                  voiceReady?: boolean;
                  micEnabled?: boolean;
                  deafened?: boolean;
                  isSpeaking?: boolean;
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
                  (
                    data.id ===
                    participantId
                  )
                    ? isSharingRef.current
                    : Boolean(
                        data.isSharing,
                      ),

                voiceReady:
                  (
                    data.id ===
                    participantId
                  )
                    ? voiceReadyRef.current
                    : Boolean(
                        data.voiceReady,
                      ),

                micEnabled:
                  (
                    data.id ===
                    participantId
                  )
                    ? micEnabledRef.current
                    : data.micEnabled !==
                        false,

                deafened:
                  (
                    data.id ===
                    participantId
                  )
                    ? deafenedRef.current
                    : Boolean(
                        data.deafened,
                      ),

                isSpeaking:
                  (
                    data.id ===
                    participantId
                  )
                    ? localSpeakingRef.current
                    : Boolean(
                        data.isSpeaking,
                      ),

                joinedAt:
                  data.joinedAt ??
                  '',
              });
            },
          );
        },
      );

      const hasSelf =
        nextParticipants.some(
          (participant) =>
            participant.id ===
            participantId,
        );

      if (!hasSelf) {
        nextParticipants.push({
          id:
            participantId,

          discordId,

          name,

          image,

          isOwner,

          isSharing:
            isSharingRef.current,

          voiceReady:
            voiceReadyRef.current,

          micEnabled:
            micEnabledRef.current,

          deafened:
            deafenedRef.current,

          isSpeaking:
            localSpeakingRef.current,

          joinedAt:
            new Date()
              .toISOString(),
        });
      }

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

      const nextIds =
        new Set(
          unique.map(
            (participant) =>
              participant.id,
          ),
        );

      if (
        presenceInitializedRef.current
      ) {
        const previousIds =
          knownParticipantIdsRef.current;

        const someoneJoined =
          unique.some(
            (participant) =>
              participant.id !==
                participantId &&
              !previousIds.has(
                participant.id,
              ),
          );

        const someoneLeft =
          Array.from(
            previousIds,
          ).some(
            (id) =>
              id !==
                participantId &&
              !nextIds.has(id),
          );

        if (someoneJoined) {
          playUiSound('join');
        }

        if (someoneLeft) {
          playUiSound('leave');
        }
      } else {
        presenceInitializedRef.current =
          true;
      }

      knownParticipantIdsRef.current =
        nextIds;

      if (
        voiceReadyRef.current
      ) {
        void connectVoiceToParticipants(
          unique,
        );
      }

      const activeVoiceIds =
        new Set(
          unique
            .filter(
              (participant) =>
                participant.voiceReady,
            )
            .map(
              (participant) =>
                participant.id,
            ),
        );

      Array.from(
        voicePeersRef.current.keys(),
      ).forEach(
        (remoteId) => {
          if (
            !activeVoiceIds.has(
              remoteId,
            )
          ) {
            closeVoicePeer(
              remoteId,
            );
          }
        },
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
          currentWatchingId ===
            participantId
        ) {
          if (
            !isSharingRef.current
          ) {
            if (
              remoteVideoRef.current
            ) {
              remoteVideoRef.current.srcObject =
                null;
            }

            watchingIdRef.current =
              null;

            setWatchingId(
              null,
            );
          }
        } else if (
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
      () => {
        syncParticipants();

        if (
          !presenceInitializedRef.current
        ) {
          presenceInitializedRef.current =
            true;
        }
      },
    );

    channel.on(
      'presence',
      {
        event:
          'join',
      },
      () => {
        syncParticipants();
      },
    );

    channel.on(
      'presence',
      {
        event:
          'leave',
      },
      () => {
        syncParticipants();
      },
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
                playUiSound(
                  'watch-start',
                );

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

              if (
                isSharingRef.current
              ) {
                playUiSound(
                  'watch-stop',
                );
              }

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

    channel.on(
      'broadcast',
      {
        event:
          'voice-signal',
      },
      async ({
        payload,
      }) => {
        const signal =
          payload as VoiceSignalPayload;

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
            case 'voice-offer': {
              await handleVoiceOffer(
                signal.senderId,
                signal.sdp,
              );

              break;
            }

            case 'voice-answer': {
              await handleVoiceAnswer(
                signal.senderId,
                signal.sdp,
              );

              break;
            }

            case 'voice-ice': {
              await handleVoiceIce(
                signal.senderId,
                signal.candidate,
              );

              break;
            }

            case 'voice-leave': {
              closeVoicePeer(
                signal.senderId,
              );

              break;
            }
          }
        } catch (error) {
          console.error(
            '[VOZ] Erro no signaling:',
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

            voiceReady:
              voiceReadyRef.current,

            micEnabled:
              micEnabledRef.current,

            deafened:
              deafenedRef.current,

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

      stopSpeakingMonitor();

      voiceStreamRef.current
        ?.getTracks()
        .forEach(
          (track) => {
            track.stop();
          },
        );

      voiceStreamRef.current =
        null;

      closeAllVoicePeers();

      voiceReadyRef.current =
        false;

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

      presenceInitializedRef.current =
        false;

      knownParticipantIdsRef.current =
        new Set();
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

  const voiceParticipants =
    participants.filter(
      (participant) =>
        participant.voiceReady,
    );

  const watchingParticipant =
    participants.find(
      (participant) =>
        participant.id ===
        watchingId,
    );


  async function leaveRoom() {
    try {
      if (watchingIdRef.current) {
        await stopWatching();
      }

      if (isSharingRef.current) {
        await stopScreenShare();
      }

      if (voiceReadyRef.current) {
        await stopVoice();
      }
    } finally {
      window.location.assign('/transmissao');
    }
  }

  return (
    <main className="relative z-[50] min-h-screen overflow-hidden bg-[#08080a] px-2 pb-3 pt-2 text-text-main sm:px-3 sm:pb-4 sm:pt-3 lg:px-4 lg:pt-4">
      {/* ATMOSFERA GRUDGE */}
      <div className="pointer-events-none absolute left-1/2 top-[-180px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-accent-hot/[0.045] blur-[180px]" />
      <div className="pointer-events-none absolute bottom-[-220px] left-[20%] h-[500px] w-[500px] rounded-full bg-accent-hot/[0.025] blur-[170px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1880px] flex-col sm:min-h-[calc(100vh-1.5rem)] lg:min-h-[calc(100vh-2rem)]">
        {/* TOPBAR */}
        <header className="mb-3 overflow-hidden rounded-[18px] border border-accent-hot/20 bg-[#0f0f12]/94 shadow-[0_14px_55px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-accent-hot/75 to-transparent" />

          <div className="flex min-h-[82px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:min-h-[62px] sm:gap-3 sm:px-4 sm:py-3 lg:px-5">
            {/* IDENTIDADE */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-14 min-w-[220px] items-center rounded-xl border border-white/[0.06] bg-black/15 px-3">
                <Image
                  src="/assets/grudge-logo.png"
                  alt="GRUDGE SMP"
                  width={1536}
                  height={512}
                  priority
                  className="h-10 w-auto max-w-[180px] object-contain object-left"
                />

                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0f0f12] ${
                    connectionStatus === 'connected'
                      ? 'bg-emerald-400'
                      : connectionStatus === 'error'
                        ? 'bg-red-400'
                        : 'animate-pulse bg-yellow-300'
                  }`}
                />
              </div>

              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="hidden text-[0.54rem] font-bold uppercase tracking-[0.15em] text-accent-hot/85 sm:inline">
                    transmissão privada
                  </span>
                </div>

                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-[0.54rem] uppercase tracking-[0.08em] text-text-dim/65">
                    {statusLabel}
                  </span>

                  {voiceReady && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-white/10" />

                      <span className="text-[0.42rem] uppercase tracking-[0.09em] text-emerald-300/70">
                        voz conectada
                      </span>
                    </>
                  )}

                  {isSharing && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-white/10" />

                      <span className="flex items-center gap-1 text-[0.42rem] font-bold uppercase tracking-[0.09em] text-accent-hot/85">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-hot" />
                        ao vivo
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* AÇÕES DA SALA */}
            <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
              {/* CÓDIGO */}
              <div className="flex h-10 items-center rounded-xl border border-white/[0.07] bg-black/25 p-1">
                <button
                  type="button"
                  onClick={copyRoomCode}
                  title="Copiar código da sala"
                  className="group flex h-8 items-center gap-2 rounded-lg px-3 transition hover:bg-white/[0.04]"
                >
                  <span className="hidden text-[0.39rem] font-bold uppercase tracking-[0.14em] text-text-dim/40 sm:inline">
                    sala
                  </span>

                  <span className="min-w-[72px] font-mono text-[0.74rem] font-bold tracking-[0.16em] text-text-main transition group-hover:text-accent-hot">
                    {showRoomCode
                      ? normalizedCode
                      : '••••••'}
                  </span>

                  <span className="text-[0.54rem] text-text-dim transition group-hover:text-accent-hot">
                    {copiedRoomCode
                      ? '✓'
                      : '⧉'}
                  </span>
                </button>

                <div className="h-4 w-px bg-white/[0.08]" />

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
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-dim transition hover:bg-white/[0.04] hover:text-accent-hot"
                  aria-label={
                    showRoomCode
                      ? 'Ocultar código da sala'
                      : 'Mostrar código da sala'
                  }
                >
                  {showRoomCode ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
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

              {/* COPIAR CONVITE */}
              <button
                type="button"
                onClick={copyInvite}
                title="Copiar convite"
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-black/20 px-3 text-text-dim transition hover:border-accent-hot/28 hover:bg-accent-hot/[0.035] hover:text-accent-hot sm:flex-none"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>

                <span className="hidden text-[0.42rem] font-bold uppercase tracking-[0.09em] sm:inline">
                  {copiedInvite
                    ? 'copiado'
                    : 'convite'}
                </span>
              </button>

              {/* SAIR DA SALA */}
              <button
                type="button"
                onClick={leaveRoom}
                title="Sair da sala"
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.045] px-3 text-red-300 transition hover:border-red-400/30 hover:bg-red-500/[0.09] sm:flex-none"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                </svg>

                <span className="hidden text-[0.42rem] font-bold uppercase tracking-[0.09em] sm:inline">
                  sair
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* ÁREA PRINCIPAL */}
        <div className="grid min-h-0 flex-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-3">
          <section className="flex min-h-0 flex-col gap-3">
            {/* PALCO */}
            <div className="group/stage relative min-h-[430px] flex-1 overflow-hidden rounded-[16px] border border-accent-hot/22 bg-[#050506] shadow-[0_24px_90px_rgba(0,0,0,0.32)] sm:min-h-[500px] sm:rounded-[18px] lg:min-h-[620px] lg:rounded-[20px]">
              <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_0%,rgba(255,61,129,0.06),transparent_36%)]" />

              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={isMuted}
                className={`absolute inset-0 h-full w-full object-contain transition duration-300 ${
                  watchingId
                    ? 'block'
                    : 'hidden'
                }`}
              />

              {/* BARRA SUPERIOR DA LIVE */}
              {watchingParticipant && (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 via-black/20 to-transparent p-4 opacity-100 transition duration-300 lg:opacity-0 lg:group-hover/stage:opacity-100">
                  <div className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-black/55 px-3 py-2 shadow-lg backdrop-blur-xl">
                    <div
                      className={`relative rounded-full transition ${
                        watchingParticipant.isSpeaking &&
                        watchingParticipant.micEnabled &&
                        watchingParticipant.voiceReady
                          ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-black/60'
                          : ''
                      }`}
                    >
                      <UserAvatar
                        image={watchingParticipant.image}
                        name={watchingParticipant.name}
                        size={31}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="max-w-[210px] truncate text-[0.63rem] font-semibold text-white">
                        {watchingParticipant.name}
                      </p>

                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[0.4rem] font-bold uppercase tracking-[0.1em] text-accent-hot">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-hot" />
                          ao vivo
                        </span>

                        {watchingParticipant.isSpeaking &&
                          watchingParticipant.micEnabled &&
                          watchingParticipant.voiceReady && (
                            <span className="flex items-center gap-1 text-[0.38rem] font-bold uppercase tracking-[0.08em] text-emerald-300">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                              falando
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="pointer-events-auto flex items-center gap-2">
                    <span className="rounded-lg border border-white/[0.08] bg-black/55 px-2.5 py-1.5 text-[0.38rem] font-bold uppercase tracking-[0.1em] text-white/55 backdrop-blur-xl">
                      transmissão privada
                    </span>
                  </div>
                </div>
              )}

              {/* ESTADO VAZIO */}
              {!watchingId && (
                <div className="absolute inset-0 z-[2] flex items-center justify-center p-8 text-center">
                  <div className="max-w-[470px]">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/[0.07] bg-white/[0.025] text-text-dim/55 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
                      <svg
                        width="27"
                        height="27"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
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
                    </div>

                    <p className="mt-5 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-accent-hot">
                      {liveParticipants.length
                        ? 'transmissão disponível'
                        : 'sala conectada'}
                    </p>

                    <h1 className="mt-2 font-display text-[clamp(2.15rem,4.5vw,3.4rem)] text-text-main">
                      {liveParticipants.length
                        ? 'Escolha uma transmissão'
                        : 'Aguardando uma transmissão'}
                    </h1>

                    <p className="mx-auto mt-2 max-w-[380px] text-[0.82rem] leading-relaxed text-text-dim/85">
                      {liveParticipants.length
                        ? 'Selecione uma pessoa ao vivo na lateral ou na faixa abaixo.'
                        : 'Quando alguém compartilhar a tela, a transmissão aparecerá aqui.'}
                    </p>

                    {isSharing && (
                      <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent-hot/25 bg-accent-hot/[0.06] px-3 py-1.5 text-[0.42rem] font-bold uppercase tracking-[0.12em] text-accent-hot">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-hot" />
                        sua tela está ao vivo
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BARRA INFERIOR DA LIVE */}
              {watchingId && (
                <div className="absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2.5 opacity-100 transition duration-300 sm:p-3 lg:p-4 lg:opacity-0 lg:group-hover/stage:opacity-100">
                  <div className="mx-auto flex w-full max-w-[660px] items-center gap-2 rounded-[13px] border border-white/[0.08] bg-black/70 p-2 shadow-2xl backdrop-blur-xl sm:rounded-[15px] sm:p-2.5">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
                        isMuted
                          ? 'border-red-400/25 bg-red-500/[0.08] text-red-300'
                          : 'border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08]'
                      }`}
                      title={isMuted ? 'Ativar áudio' : 'Silenciar'}
                    >
                      {isMuted ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M11 5 6 9H2v6h4l5 4Z" />
                          <path d="m22 9-6 6" />
                          <path d="m16 9 6 6" />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M11 5 6 9H2v6h4l5 4Z" />
                          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                          <path d="M18 6a8 8 0 0 1 0 12" />
                        </svg>
                      )}
                    </button>

                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={changeVolume}
                      className="min-w-0 flex-1 cursor-pointer accent-pink-500"
                      aria-label="Volume"
                    />

                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
                      title="Tela cheia"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M8 3H3v5" />
                        <path d="m3 3 6 6" />
                        <path d="M16 3h5v5" />
                        <path d="m21 3-6 6" />
                        <path d="M8 21H3v-5" />
                        <path d="m3 21 6-6" />
                        <path d="M16 21h5v-5" />
                        <path d="m21 21-6-6" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={stopWatching}
                      className="flex h-9 items-center gap-2 rounded-full border border-red-400/22 bg-red-500/[0.07] px-3 text-[0.42rem] font-bold uppercase tracking-[0.08em] text-red-300 transition hover:bg-red-500/[0.12]"
                      title="Fechar transmissão"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 6 12 12" />
                        <path d="m18 6-12 12" />
                      </svg>

                      <span className="hidden sm:inline">
                        fechar
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* VINHETA VISUAL */}
              <div className="pointer-events-none absolute inset-0 z-[3] shadow-[inset_0_0_90px_rgba(0,0,0,0.35)]" />
            </div>

            {/* FAIXA DE TRANSMISSÕES */}
            <div className="rounded-[16px] border border-accent-hot/14 bg-[#111114]/82 p-2.5 shadow-[0_16px_50px_rgba(0,0,0,0.16)] sm:rounded-[18px] sm:p-3">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.39rem] font-bold uppercase tracking-[0.18em] text-accent-hot/80">
                    transmissões
                  </p>

                  <p className="mt-0.5 text-[0.52rem] text-text-dim/55">
                    {liveParticipants.length === 0
                      ? 'Nenhuma live ativa'
                      : liveParticipants.length === 1
                        ? '1 live ativa agora'
                        : `${liveParticipants.length} lives ativas agora`}
                  </p>
                </div>

                {liveParticipants.length > 0 && (
                  <span className="rounded-lg border border-accent-hot/15 bg-accent-hot/[0.045] px-2 py-1 text-[0.37rem] font-bold uppercase tracking-[0.08em] text-accent-hot/80">
                    ao vivo
                  </span>
                )}
              </div>

              {liveParticipants.length === 0 ? (
                <div className="flex min-h-[84px] items-center justify-center rounded-[14px] border border-dashed border-white/[0.08] bg-black/[0.08] text-[0.48rem] uppercase tracking-[0.13em] text-text-dim/35">
                  aguardando transmissões
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {liveParticipants.map((participant) => {
                    const isMe =
                      participant.id === participantId;

                    const selected =
                      participant.id === watchingId;

                    const speaking =
                      participant.isSpeaking &&
                      participant.micEnabled &&
                      participant.voiceReady;

                    return (
                      <button
                        key={participant.id}
                        type="button"
                        onClick={() =>
                          watchStreamer(
                            participant.id,
                          )
                        }
                        className={`group relative min-w-[220px] overflow-hidden rounded-[14px] border text-left transition duration-200 sm:min-w-[240px] lg:min-w-[260px] ${
                          selected
                            ? 'border-accent-hot/55 bg-accent-hot/[0.055] shadow-[0_0_28px_rgba(255,61,129,0.06)]'
                            : 'border-accent-hot/12 bg-black/[0.18] hover:border-accent-hot/35 hover:bg-black/[0.24]'
                        } ${
                          isMe
                            ? 'cursor-default'
                            : 'cursor-pointer'
                        }`}
                      >
                        <div className="relative flex min-h-[82px] items-center gap-3 px-3 py-3">
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.018] to-transparent" />

                          <div
                            className={`relative z-[1] rounded-full transition ${
                              speaking
                                ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#111114]'
                                : ''
                            }`}
                          >
                            <UserAvatar
                              image={participant.image}
                              name={participant.name}
                              size={42}
                            />

                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#111114] bg-accent-hot shadow-[0_0_8px_rgba(255,61,129,0.4)]" />
                          </div>

                          <div className="relative z-[1] min-w-0 flex-1">
                            <p className="truncate text-[0.64rem] font-semibold text-text-main">
                              {participant.name}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="flex items-center gap-1 text-[0.38rem] font-bold uppercase tracking-[0.09em] text-accent-hot">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-hot" />
                                ao vivo
                              </span>

                              {speaking && (
                                <span className="text-[0.37rem] font-bold uppercase tracking-[0.08em] text-emerald-300">
                                  falando
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-[0.38rem] text-text-dim/40">
                              {isMe
                                ? selected
                                  ? 'visualizando sua transmissão'
                                  : 'clique para visualizar'
                                : selected
                                  ? 'assistindo agora'
                                  : 'clique para assistir'}
                            </p>
                          </div>

                          <div
                              className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                                selected
                                  ? 'border-accent-hot bg-accent-hot text-bg-deep'
                                  : 'border-white/[0.08] bg-black/20 text-text-dim group-hover:border-accent-hot/35 group-hover:text-accent-hot'
                              }`}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M8 5v14l11-7Z" />
                              </svg>
                            </div>
                        </div>

                        <div
                          className={`h-px w-full ${
                            selected
                              ? 'bg-gradient-to-r from-transparent via-accent-hot to-transparent'
                              : 'bg-white/[0.04]'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* SIDEBAR DE PARTICIPANTES */}
          <aside className="flex max-h-[54vh] min-h-[360px] flex-col overflow-hidden rounded-[16px] border border-accent-hot/14 bg-[#111114]/88 shadow-[0_20px_70px_rgba(0,0,0,0.18)] sm:max-h-[58vh] sm:min-h-[420px] sm:rounded-[18px] lg:max-h-none lg:min-h-[400px] lg:rounded-[20px]">
            <div className="border-b border-white/[0.07] px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.17em] text-accent-hot">
                    sala privada
                  </p>

                  <h2 className="mt-1 font-display text-[1.28rem] text-text-main">
                    Participantes
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {voiceParticipants.length > 0 && (
                    <span className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.045] px-2 py-1 text-[0.38rem] font-bold uppercase tracking-[0.08em] text-emerald-300/80">
                      {voiceParticipants.length} na voz
                    </span>
                  )}

                  <span className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-black/20 px-2 text-[0.68rem] font-bold text-text-main">
                    {participants.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {participants.map((participant) => {
                const isMe =
                  participant.id === participantId;

                const isWatching =
                  participant.id === watchingId;

                const isActivelySpeaking =
                  participant.isSpeaking &&
                  participant.micEnabled &&
                  participant.voiceReady;

                return (
                  <article
                    key={participant.id}
                    className={`group rounded-[13px] border px-2.5 py-2.5 transition ${
                      isWatching
                        ? 'border-accent-hot/38 bg-accent-hot/[0.045]'
                        : isActivelySpeaking
                          ? 'border-emerald-400/22 bg-emerald-400/[0.035]'
                          : 'border-transparent bg-black/[0.08] hover:border-white/[0.07] hover:bg-black/[0.17]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`relative rounded-full transition ${
                          isActivelySpeaking
                            ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#111114] shadow-[0_0_20px_rgba(52,211,153,0.2)]'
                            : ''
                        }`}
                      >
                        <UserAvatar
                          image={participant.image}
                          name={participant.name}
                          size={36}
                        />

                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#111114] bg-emerald-400" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="truncate text-[0.74rem] font-semibold text-text-main">
                            {participant.name}
                          </p>

                          {isMe && (
                            <span className="shrink-0 rounded-full border border-white/[0.06] px-1.5 py-0.5 text-[0.33rem] font-bold uppercase tracking-[0.07em] text-text-dim/50">
                              você
                            </span>
                          )}

                          {participant.isOwner && (
                            <span
                              title="Dono da sala"
                              className="shrink-0 text-[0.54rem] text-yellow-200/80"
                            >
                              ◆
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          {isActivelySpeaking ? (
                            <span className="flex items-center gap-1 text-[0.48rem] font-bold uppercase tracking-[0.08em] text-emerald-300">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                              falando
                            </span>
                          ) : participant.voiceReady ? (
                            <span
                              className={`flex items-center gap-1 text-[0.48rem] ${
                                participant.micEnabled
                                  ? 'text-text-dim/55'
                                  : 'text-red-300/75'
                              }`}
                            >
                              {participant.micEnabled ? (
                                <svg
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <rect x="9" y="2" width="6" height="12" rx="3" />
                                  <path d="M5 10a7 7 0 0 0 14 0" />
                                  <path d="M12 17v5" />
                                </svg>
                              ) : (
                                <svg
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="m3 3 18 18" />
                                  <path d="M9 9v1a3 3 0 0 0 5.12 2.12" />
                                  <path d="M15 9.34V5a3 3 0 0 0-5.94-.6" />
                                  <path d="M5 10a7 7 0 0 0 11.74 5.14" />
                                </svg>
                              )}

                              {participant.micEnabled
                                ? 'na voz'
                                : 'mic mutado'}
                            </span>
                          ) : (
                            <span className="text-[0.48rem] text-text-dim/55">
                              online
                            </span>
                          )}

                          {participant.deafened && (
                            <span
                              title="Áudio desativado"
                              className="flex items-center gap-1 text-[0.46rem] text-red-300/70"
                            >
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="m3 3 18 18" />
                                <path d="M6.7 6.7A9 9 0 0 0 3 14v3a2 2 0 0 0 2 2h2v-7" />
                                <path d="M17 12v7h2a2 2 0 0 0 2-2v-3a9 9 0 0 0-8.3-8.97" />
                              </svg>
                              áudio off
                            </span>
                          )}

                          {participant.isSharing && (
                            <span className="flex items-center gap-1 text-[0.46rem] font-bold uppercase tracking-[0.08em] text-accent-hot">
                              <span className="h-1.5 w-1.5 rounded-full bg-accent-hot" />
                              ao vivo
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {participant.isSharing && (
                          <button
                            type="button"
                            onClick={() =>
                              watchStreamer(
                                participant.id,
                              )
                            }
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                              isWatching
                                ? 'border-accent-hot bg-accent-hot text-bg-deep'
                                : 'border-white/[0.07] bg-black/20 text-text-dim hover:border-accent-hot/35 hover:text-accent-hot'
                            }`}
                            title={
                              isWatching
                                ? 'Assistindo agora'
                                : 'Assistir transmissão'
                            }
                            aria-label={
                              isWatching
                                ? 'Assistindo transmissão'
                                : 'Assistir transmissão'
                            }
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M8 5v14l11-7Z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="border-t border-white/[0.06] px-3 py-2.5">
              <div className="flex items-center justify-between text-[0.37rem] uppercase tracking-[0.09em] text-text-dim/35">
                <span>
                  {liveParticipants.length}
                  {' '}
                  {liveParticipants.length === 1
                    ? 'live ativa'
                    : 'lives ativas'}
                </span>

                <span>
                  {voiceParticipants.length}
                  {' '}
                  {voiceParticipants.length === 1
                    ? 'na voz'
                    : 'na voz'}
                </span>
              </div>
            </div>
          </aside>
        </div>

        {voiceError && (
          <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/[0.06] px-4 py-2.5 text-center text-[0.54rem] text-red-300">
            {voiceError}
          </div>
        )}

        <div className="mt-2 hidden flex-wrap items-center justify-center gap-3 text-[0.4rem] uppercase tracking-[0.1em] text-text-dim/40 sm:flex sm:mt-3">
          <span>
            {voiceReady
              ? micEnabled
                ? 'microfone ativo'
                : 'microfone mutado'
              : 'voz desconectada'}
          </span>

          <span className="text-white/10">
            •
          </span>

          <span>
            {voiceReady
              ? deafened
                ? 'áudio desativado'
                : 'áudio ativo'
              : 'clique no microfone para entrar'}
          </span>

          {isSharing && (
            <>
              <span className="text-white/10">
                •
              </span>

              <span className="text-accent-hot/70">
                transmitindo tela
              </span>
            </>
          )}
        </div>

        {/* DOCK INFERIOR */}
        <footer className="sticky bottom-2 z-[20] mt-2 flex flex-col gap-2 rounded-[16px] border border-accent-hot/14 bg-[#111114]/96 px-2.5 py-2.5 shadow-[0_-10px_45px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:bottom-3 sm:mt-3 sm:rounded-[18px] sm:px-3 sm:py-3 lg:static lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:px-4">
          {/* CONTA */}
          <div className="flex w-full min-w-0 items-center gap-2.5 lg:w-auto">
            <div
              className={`shrink-0 rounded-full transition ${
                localSpeaking &&
                micEnabled &&
                voiceReady
                  ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#111114] shadow-[0_0_20px_rgba(52,211,153,0.22)]'
                  : ''
              }`}
            >
              <UserAvatar
                image={image}
                name={name}
                size={38}
              />
            </div>

            <div className="hidden min-w-0 sm:block">
              <div className="flex items-center gap-1.5">
                <p className="max-w-[150px] truncate text-[0.61rem] font-semibold text-text-main">
                  {name}
                </p>

                {isOwner && (
                  <span className="rounded-full border border-accent-hot/20 bg-accent-hot/[0.05] px-1.5 py-0.5 text-[0.34rem] font-bold uppercase tracking-[0.08em] text-accent-hot">
                    dono
                  </span>
                )}
              </div>

              <p className={`mt-0.5 text-[0.4rem] uppercase tracking-[0.1em] ${
                localSpeaking &&
                micEnabled &&
                voiceReady
                  ? 'text-emerald-300'
                  : 'text-text-dim/45'
              }`}>
                {reconnectingVoice
                  ? 'reconectando voz'
                  : localSpeaking &&
                    micEnabled &&
                    voiceReady
                    ? 'falando'
                    : voiceReady
                      ? 'na voz'
                      : 'conectado'}
              </p>
            </div>
          </div>

          {/* CONTROLES */}
          <div className="flex w-full flex-wrap items-center justify-center gap-2 lg:w-auto lg:flex-1">
            {/* MICROFONE */}
            <button
              type="button"
              onClick={toggleMicrophone}
              title={
                !voiceReady
                  ? 'Conectar ao canal de voz'
                  : micEnabled
                    ? 'Mutar microfone'
                    : 'Ativar microfone'
              }
              className={`group flex h-11 w-11 items-center justify-center rounded-full border transition duration-200 ${
                !voiceReady
                  ? 'border-white/[0.08] bg-black/25 text-text-main hover:border-accent-hot/30 hover:text-accent-hot'
                  : micEnabled
                    ? 'border-emerald-400/20 bg-emerald-400/[0.055] text-emerald-300 hover:bg-emerald-400/[0.09]'
                    : 'border-red-400/25 bg-red-500/[0.08] text-red-300 hover:bg-red-500/[0.13]'
              }`}
              aria-label={
                !voiceReady
                  ? 'Conectar ao canal de voz'
                  : micEnabled
                    ? 'Mutar microfone'
                    : 'Ativar microfone'
              }
            >
              {micEnabled || !voiceReady ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect
                    x="9"
                    y="2"
                    width="6"
                    height="12"
                    rx="3"
                  />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <path d="M12 17v5" />
                  <path d="M8 22h8" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m3 3 18 18" />
                  <path d="M9 9v1a3 3 0 0 0 5.12 2.12" />
                  <path d="M15 9.34V5a3 3 0 0 0-5.94-.6" />
                  <path d="M5 10a7 7 0 0 0 11.74 5.14" />
                  <path d="M19 10a7 7 0 0 1-.3 2.03" />
                  <path d="M12 17v5" />
                  <path d="M8 22h8" />
                </svg>
              )}
            </button>

            {/* ÁUDIO / ENSURDECER */}
            <button
              type="button"
              onClick={toggleDeafen}
              title={
                !voiceReady
                  ? 'Conectar ao canal de voz'
                  : deafened
                    ? 'Voltar a ouvir'
                    : 'Desativar áudio da chamada'
              }
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition duration-200 ${
                !voiceReady
                  ? 'border-white/[0.08] bg-black/25 text-text-main hover:border-accent-hot/30 hover:text-accent-hot'
                  : deafened
                    ? 'border-red-400/25 bg-red-500/[0.08] text-red-300 hover:bg-red-500/[0.13]'
                    : 'border-emerald-400/20 bg-emerald-400/[0.055] text-emerald-300 hover:bg-emerald-400/[0.09]'
              }`}
              aria-label={
                !voiceReady
                  ? 'Conectar ao canal de voz'
                  : deafened
                    ? 'Voltar a ouvir'
                    : 'Desativar áudio da chamada'
              }
            >
              {deafened ? (
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m3 3 18 18" />
                  <path d="M6.7 6.7A9 9 0 0 0 3 14v3a2 2 0 0 0 2 2h2v-7" />
                  <path d="M17 12v7h2a2 2 0 0 0 2-2v-3a9 9 0 0 0-8.3-8.97" />
                </svg>
              ) : (
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 14a8 8 0 0 1 16 0" />
                  <path d="M18 19h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-1z" />
                  <path d="M6 19H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1z" />
                </svg>
              )}
            </button>

            {/* RECONNECT */}
            {voiceReady && (
              <button
                type="button"
                onClick={reconnectVoice}
                disabled={reconnectingVoice}
                title="Reconectar áudio da sala"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-black/25 text-text-dim transition hover:border-accent-hot/25 hover:text-accent-hot disabled:cursor-wait disabled:opacity-60"
                aria-label="Reconectar áudio da sala"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={reconnectingVoice ? 'animate-spin' : ''}
                  aria-hidden="true"
                >
                  <path d="M20 11a8 8 0 1 0-2.34 5.66" />
                  <path d="M20 4v7h-7" />
                </svg>
              </button>
            )}

            {/* SAIR DA VOZ */}
            {voiceReady && (
              <button
                type="button"
                onClick={stopVoice}
                title="Sair do canal de voz"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-black/25 text-text-dim transition hover:border-red-400/25 hover:bg-red-500/[0.07] hover:text-red-300"
                aria-label="Sair do canal de voz"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                </svg>
              </button>
            )}

            <div className="mx-1 hidden h-7 w-px bg-white/[0.07] sm:block" />

            {/* COMPARTILHAR TELA */}
            {!isSharing ? (
              <button
                type="button"
                onClick={startScreenShare}
                title="Compartilhar tela"
                className="flex h-11 items-center gap-2 rounded-full bg-accent-hot px-5 text-bg-deep shadow-[0_10px_32px_rgba(255,61,129,0.18)] shadow-[0_8px_25px_rgba(255,61,129,0.12)] transition hover:-translate-y-0.5 hover:brightness-110"
              >
                <svg
                  width="18"
                  height="18"
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
                  <path d="M12 8v5" />
                  <path d="m9.5 10.5 2.5-2.5 2.5 2.5" />
                  <path d="M8 21h8" />
                  <path d="M12 17v4" />
                </svg>

                <span className="hidden text-[0.45rem] font-bold uppercase tracking-[0.09em] sm:inline">
                  compartilhar
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopScreenShare}
                title="Parar compartilhamento"
                className="flex h-11 items-center gap-2 rounded-full border border-accent-hot/35 bg-accent-hot/[0.08] px-4 text-accent-hot transition hover:bg-accent-hot/[0.13]"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent-hot" />

                <span className="hidden text-[0.45rem] font-bold uppercase tracking-[0.09em] sm:inline">
                  transmitindo
                </span>
              </button>
            )}
          </div>

          {/* SAIR */}
          
        </footer>
      </div>
    </main>
  );
}
