import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';

export default async function SemAcessoPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  return (
    <main className="relative z-[1] mx-auto flex min-h-screen max-w-[620px] items-center justify-center px-6 py-20">
      <section className="w-full rounded-[24px] border border-line-soft bg-bg-mid/30 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-md sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-hot/30 bg-accent-hot/10 text-accent-hot">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect
              x="5"
              y="11"
              width="14"
              height="10"
              rx="2"
            />

            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>

        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent-hot">
          acesso bloqueado
        </p>

        <h1 className="mt-3 font-display text-3xl text-text-main">
          Você não possui acesso
        </h1>

        <p className="mx-auto mt-3 max-w-[420px] text-[0.82rem] leading-relaxed text-text-dim">
          Sua conta está autorizada a usar o painel,
          mas não possui permissão para acessar esta
          área.
        </p>

        <Link
          href="/admin/calendario"
          className="mt-7 inline-flex rounded-xl border border-line-soft px-5 py-3 text-[0.78rem] font-bold text-text-main transition hover:border-accent-hot hover:text-accent-hot"
        >
          voltar ao painel
        </Link>
      </section>
    </main>
  );
}