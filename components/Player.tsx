'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  Song,
  SitePage,
} from '@/lib/music';

type PlayerProps = {
  songs: Song[];
  variant?: 'fixed' | 'inline';
};

const ERROR_MESSAGES: Record<number, string> = {
  1: 'carregamento abortado',
  2: 'erro de rede ao carregar o áudio',
  3: 'erro ao decodificar o arquivo',
  4: 'arquivo não encontrado ou formato não suportado',
};

function normalizePathname(
  pathname: string,
): SitePage | null {
  if (pathname === '/') {
    return '/';
  }

  if (pathname.startsWith('/alfabeto')) {
    return '/alfabeto';
  }

  if (pathname.startsWith('/calendario')) {
    return '/calendario';
  }

  if (pathname.startsWith('/enigmas')) {
    return '/enigmas';
  }

  return null;
}

export default function Player({
  songs,
  variant = 'fixed',
}: PlayerProps) {
  const pathname = usePathname();

  const audioRef =
    useRef<HTMLAudioElement>(null);

  const shouldContinuePlaying =
    useRef(false);

  const currentPage =
    normalizePathname(pathname);

  const allowedSongs = useMemo(() => {
    if (!currentPage) {
      return [];
    }

    return songs.filter((song) =>
      song.pages.includes(currentPage),
    );
  }, [songs, currentPage]);

  const [
    currentSongIndex,
    setCurrentSongIndex,
  ] = useState(0);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [isMuted, setIsMuted] =
    useState(false);

  const [volume, setVolume] =
    useState(0.6);

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  const currentSong =
    allowedSongs[currentSongIndex];

  useEffect(() => {
    setCurrentSongIndex(0);
    setIsPlaying(false);
    setErrorMsg(null);

    shouldContinuePlaying.current =
      false;

    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [pathname]);

  useEffect(() => {
    if (
      currentSongIndex >=
      allowedSongs.length
    ) {
      setCurrentSongIndex(0);
    }
  }, [
    allowedSongs.length,
    currentSongIndex,
  ]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = volume;
    audio.muted = isMuted;
  }, [
    volume,
    isMuted,
    currentSongIndex,
  ]);

  useEffect(() => {
    if (
      !shouldContinuePlaying.current
    ) {
      return;
    }

    shouldContinuePlaying.current =
      false;

    const timeout =
      window.setTimeout(() => {
        void playAudio();
      }, 0);

    return () =>
      window.clearTimeout(timeout);
  }, [currentSongIndex]);

  async function playAudio() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    try {
      audio.volume = volume;
      audio.muted = isMuted;

      await audio.play();

      setErrorMsg(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      setErrorMsg(
        `não foi possível tocar: ${message}`,
      );

      console.warn(
        'Não foi possível tocar o áudio:',
        error,
      );
    }
  }

  function togglePlay() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      void playAudio();
    } else {
      audio.pause();
    }
  }

  function nextSong(
    continuePlaying = isPlaying,
  ) {
    if (allowedSongs.length <= 1) {
      const audio = audioRef.current;

      if (audio) {
        audio.currentTime = 0;

        if (continuePlaying) {
          void playAudio();
        }
      }

      return;
    }

    shouldContinuePlaying.current =
      continuePlaying;

    setErrorMsg(null);

    setCurrentSongIndex(
      (currentIndex) =>
        (currentIndex + 1) %
        allowedSongs.length,
    );
  }

  function previousSong() {
    if (allowedSongs.length <= 1) {
      const audio = audioRef.current;

      if (audio) {
        audio.currentTime = 0;

        if (isPlaying) {
          void playAudio();
        }
      }

      return;
    }

    shouldContinuePlaying.current =
      isPlaying;

    setErrorMsg(null);

    setCurrentSongIndex(
      (currentIndex) =>
        (currentIndex -
          1 +
          allowedSongs.length) %
        allowedSongs.length,
    );
  }

  function handleAudioError() {
    const audio = audioRef.current;

    const code =
      audio?.error?.code;

    const message = code
      ? ERROR_MESSAGES[code] ??
        `erro desconhecido (código ${code})`
      : 'arquivo de áudio indisponível';

    setErrorMsg(message);
    setIsPlaying(false);

    console.warn(
      `Não foi possível carregar "${currentSong?.name ?? 'música'}": ${message}`,
    );
  }

  function toggleMute() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.muted = !audio.muted;

    setIsMuted(audio.muted);
  }

  function handleVolume(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const value = Number(
      event.target.value,
    );

    const audio = audioRef.current;

    setVolume(value);

    if (!audio) {
      return;
    }

    audio.volume = value;

    if (value === 0) {
      audio.muted = true;
      setIsMuted(true);
    } else if (audio.muted) {
      audio.muted = false;
      setIsMuted(false);
    }
  }

  if (
    !currentPage ||
    allowedSongs.length === 0 ||
    !currentSong
  ) {
    return null;
  }

  const wrapperClassName =
    variant === 'inline'
      ? 'relative flex w-full max-w-[430px] flex-col items-center gap-2'
      : 'fixed right-4 top-20 z-30 flex flex-col items-end gap-1.5';

  const playerClassName =
    variant === 'inline'
      ? 'flex w-full items-center gap-3 rounded-[20px] border border-line-soft bg-bg-deep/55 px-4 py-3 shadow-xl backdrop-blur-md'
      : 'flex items-center gap-3 rounded-full border border-line-soft bg-bg-deep/55 px-3.5 py-2 pl-2 shadow-lg backdrop-blur-md';

  const coverClassName =
    variant === 'inline'
      ? 'h-12 w-12 flex-shrink-0 rounded-xl border border-line-soft object-cover'
      : 'h-[38px] w-[38px] flex-shrink-0 rounded-full border border-line-soft object-cover';

  const fallbackCoverClassName =
    variant === 'inline'
      ? 'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-line-soft bg-bg-mid/60 text-xl text-text-dim'
      : 'flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full border border-line-soft bg-bg-mid/60 text-lg text-text-dim';

  return (
    <div className={wrapperClassName}>
      <div className={playerClassName}>
        {currentSong.cover ? (
          <Image
            src={currentSong.cover}
            alt={`Capa de ${currentSong.name}`}
            width={
              variant === 'inline'
                ? 48
                : 38
            }
            height={
              variant === 'inline'
                ? 48
                : 38
            }
            className={
              coverClassName
            }
          />
        ) : (
          <div
            className={
              fallbackCoverClassName
            }
          >
            ♪
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            title={currentSong.name}
            className={`truncate tracking-wide text-text-dim ${
              variant === 'inline'
                ? 'max-w-full text-[0.8rem]'
                : 'max-w-[130px] text-[0.72rem] sm:max-w-[100px]'
            }`}
          >
            {currentSong.name}
          </span>

          <div
            className={`flex items-center ${
              variant === 'inline'
                ? 'justify-between gap-2'
                : 'gap-1'
            }`}
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={previousSong}
                aria-label="Música anterior"
                title="Música anterior"
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-main transition hover:scale-110 hover:text-accent-hot"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18 5v14l-9-7 9-7zM6 5h2v14H6z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={
                  isPlaying
                    ? 'Pausar música'
                    : 'Tocar música'
                }
                title={
                  isPlaying
                    ? 'Pausar'
                    : 'Tocar'
                }
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-hot/10 text-text-main transition hover:scale-110 hover:bg-accent-hot/20 hover:text-accent-hot"
              >
                {isPlaying ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  nextSong()
                }
                aria-label="Próxima música"
                title="Próxima música"
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-main transition hover:scale-110 hover:text-accent-hot"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M6 5v14l9-7-9-7zm10 0v14h2V5h-2z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={
                  isMuted
                    ? 'Ativar som'
                    : 'Mutar'
                }
                title={
                  isMuted
                    ? 'Ativar som'
                    : 'Mutar'
                }
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-main transition hover:scale-110 hover:text-accent-hot"
              >
                {isMuted ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.06l2.45 2.45c.03-.16.05-.33.05-.48zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.94 8.94 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4l-1.88 1.88L12 7.76V4z" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12z" />
                  </svg>
                )}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolume}
                aria-label="Volume"
                className={`accent-accent-hot ${
                  variant === 'inline'
                    ? 'w-20 sm:w-28'
                    : 'w-14 sm:w-10'
                }`}
              />
            </div>
          </div>
        </div>

        <audio
          key={`${pathname}-${currentSong.id}`}
          ref={audioRef}
          src={currentSong.audio}
          preload="metadata"
          onPlay={() =>
            setIsPlaying(true)
          }
          onPause={() =>
            setIsPlaying(false)
          }
          onEnded={() =>
            nextSong(true)
          }
          onError={
            handleAudioError
          }
        />
      </div>

      {errorMsg && (
        <span
          className={`max-w-[260px] rounded-lg bg-bg-deep/80 px-2.5 py-1 text-[0.65rem] leading-snug text-accent-hot ${
            variant === 'inline'
              ? 'text-center'
              : 'text-right'
          }`}
        >
          {errorMsg}
        </span>
      )}
    </div>
  );
}