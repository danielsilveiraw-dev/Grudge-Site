'use client';

import {
  useRef,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

export default function AdminStreamerForm() {
  const router = useRouter();

  const formRef =
    useRef<HTMLFormElement>(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState('');

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const form =
        event.currentTarget;

      const formData =
        new FormData(form);

      const response =
        await fetch(
          '/api/admin/streamers',
          {
            method: 'POST',
            body: formData,
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        setMessage(
          result.error ??
            'Erro ao adicionar streamer.',
        );

        return;
      }

      formRef.current?.reset();

      setMessage(
        'Streamer adicionado com sucesso.',
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        'Erro ao enviar os dados.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="flex flex-col gap-4"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
        >
          nome
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="nome do streamer"
          className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="image"
          className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
        >
          foto
        </label>

        <input
          id="image"
          name="image"
          type="file"
          required
          accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
          className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-2.5 text-[0.85rem] text-text-dim file:mr-3 file:rounded-lg file:border-0 file:bg-accent-hot file:px-3 file:py-1.5 file:text-[0.75rem] file:font-bold file:text-bg-deep"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          name="instagram"
          type="url"
          placeholder="Instagram"
          className="rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
        />

        <input
          name="youtube"
          type="url"
          placeholder="YouTube"
          className="rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
        />

        <input
          name="twitch"
          type="url"
          placeholder="Twitch"
          className="rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
        />

        <input
          name="kick"
          type="url"
          placeholder="Kick"
          className="rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
        />

        <input
          name="tiktok"
          type="url"
          placeholder="TikTok"
          className="rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
        />

        <input
          name="x"
          type="url"
          placeholder="X / Twitter"
          className="rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
        />

        <input
          name="discord"
          type="url"
          placeholder="Discord"
          className="rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none sm:col-span-2"
        />
      </div>

      {message && (
        <p className="text-[0.75rem] text-accent-hot">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 rounded-xl bg-accent-hot px-4 py-3 font-bold text-bg-deep transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
      >
        {loading
          ? 'enviando...'
          : 'adicionar streamer'}
      </button>
    </form>
  );
}