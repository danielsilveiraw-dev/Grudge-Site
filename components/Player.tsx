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
  1: 'A reprodução foi interrompida.',
  2: 'Ocorreu um erro ao carregar o áudio.',
  3: 'Não foi possível reproduzir esta música.',
  4: 'Formato de áudio não suportado.',
};

function getCurrentPage(pathname: string): SitePage | null {
  if (pathname === '/') {
    return '/';
  }

  if (
    pathname === '/alfabeto' ||
    pathname.startsWith('/alfabeto/')
  ) {
    return '/alfabeto';
  }

  if (
    pathname === '/calendario' ||
    pathname.startsWith('/calendario/')
  ) {
    return '/calendario';
  }

  if (
    pathname === '/enigmas' ||
    pathname.startsWith('/enigmas/')
  ) {
    return '/enigmas';
  }

  return null;
}

export default function Player({
  songs,
  variant = 'fixed',
}: PlayerProps) {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentPage = getCurrentPage(pathname);

  const availableSongs = useMemo(() => {
    if (!currentPage) {
      return [];
    }

    return songs.filter((song) =>
      song.pages.includes(currentPage),
    );
  }, [songs, currentPage]);

  const [currentSongIndex, setCurrentSongIndex] =
    useState(0);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [isMuted, setIsMuted] =
    useState(false);

  const [volume, setVolume] =
    useState(0.7);

  const [error, setError] =
    useState('');

  const currentSong =
    availableSongs[currentSongIndex];

  useEffect(() => {
    setCurrentSongIndex(0);
    setIsPlaying(false);
    setError('');

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [pathname]);

  useEffect(() => {
    if (
      currentSongIndex >= availableSongs.length
    ) {
      setCurrentSongIndex(0);
    }
  }, [
    availableSongs.length,
    currentSongIndex,
  ]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = volume;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentSong) {
      return;
    }

    audio.load();

    if (isPlaying) {
      audio
        .play()
        .catch(() => {
          setIsPlaying(false);
        });
    }
  }, [currentSong?.id]);

  async function togglePlay() {
    const audio = audioRef.current;

    if (!audio || !currentSong) {
      return;
    }

    setError('');

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        return;
      }

      await audio.play();
      setIsPlaying(true);
    } catch (playError) {
      console.error(
        'Erro ao reproduzir áudio:',
        playError,
      );

      setIsPlaying(false);
      setError(
        'Não foi possível iniciar a reprodução.',
      );
    }
  }

  function previousSong() {
    if (availableSongs.length === 0) {
      return;
    }

    setError('');

    setCurrentSongIndex((current) => {
      if (current <= 0) {
        return availableSongs.length - 1;
      }

      return current - 1;
    });
  }

  function nextSong(
    continuePlaying = false,
  ) {
    if (availableSongs.length === 0) {
      return;
    }

    setError('');

    if (continuePlaying) {
      setIsPlaying(true);
    }

    setCurrentSongIndex((current) => {
      if (
        current >=
        availableSongs.length - 1
      ) {
        return 0;
      }

      return current + 1;
    });
  }

  function toggleMute() {
    setIsMuted((current) => !current);
  }

  function handleVolumeChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const nextVolume =
      Number(event.target.value);

    setVolume(nextVolume);

    if (nextVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  }

  function handleAudioError() {
    const audio = audioRef.current;

    if (!audio?.error) {
      setError(
        'Não foi possível carregar esta música.',
      );
      setIsPlaying(false);
      return;
    }

    setError(
      ERROR_MESSAGES[audio.error.code] ??
        'Ocorreu um erro ao reproduzir esta música.',
    );

    setIsPlaying(false);
  }

  if (!currentPage || availableSongs.length === 0) {
    return null;
  }

  const isInline = variant === 'inline';

  return (
    <div
      className={
        isInline
          ? 'w-full'
          : 'fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-[620px] -translate-x-1/2'
      }
    >
      <div className="rounded-[20px] border border-line-soft bg-bg-deep/90 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-line-soft bg-bg-mid sm:h-14 sm:w-14">
            {currentSong.cover ? (
              <Image
                src={currentSong.cover}
                alt={currentSong.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl text-text-dim">
                ♪
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[0.95rem] text-text-main sm:text-base">
              {currentSong.name}
            </p>

            <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-text-dim">
              {currentSongIndex + 1} /{' '}
              {availableSongs.length}
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={previousSong}
              aria-label="Música anterior"
              title="Música anterior"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line-soft text-text-main transition hover:border-accent-hot hover:text-accent-hot"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6 5h2v14H6V5Zm3.5 7 8.5-7v14l-8.5-7Z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={
                isPlaying
                  ? 'Pausar música'
                  : 'Reproduzir música'
              }
              title={
                isPlaying
                  ? 'Pausar'
                  : 'Reproduzir'
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-hot text-bg-deep transition hover:brightness-110"
            >
              {isPlaying ? (
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M6 5h4v14H6V5Zm8 0h4v14h-4V5Z" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7L8 5Z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => nextSong(isPlaying)}
              aria-label="Próxima música"
              title="Próxima música"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line-soft text-text-main transition hover:border-accent-hot hover:text-accent-hot"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16 5h2v14h-2V5ZM6 5l8.5 7L6 19V5Z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={
              isMuted
                ? 'Ativar som'
                : 'Silenciar'
            }
            title={
              isMuted
                ? 'Ativar som'
                : 'Silenciar'
            }
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-text-dim transition hover:text-accent-hot"
          >
            {isMuted || volume === 0 ? (
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                <path d="m22 9-6 6" />
                <path d="m16 9 6 6" />
              </svg>
            ) : (
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
            className={
              isInline
                ? 'h-1 w-full cursor-pointer accent-accent-hot'
                : 'hidden h-1 flex-1 cursor-pointer accent-accent-hot sm:block'
            }
          />
        </div>

        <audio
          ref={audioRef}
          src={currentSong.audio}
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => nextSong(true)}
          onError={handleAudioError}
        />

        {error && (
          <p className="mt-2 text-[0.68rem] text-accent-hot">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}