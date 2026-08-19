import Image from 'next/image';
import {
  redirect,
} from 'next/navigation';

import {
  auth,
  signOut,
} from '@/auth';

import {
  createRoomAction,
  joinRoomAction,
} from './actions';

type PageProps = {
  searchParams: Promise<{
    erro?: string;
  }>;
};

type TransmissionUser = {
  name?: string | null;
  image?: string | null;
  discordId?: string;
  discordUsername?: string;
};

export default async function TransmissionPage({
  searchParams,
}: PageProps) {
  const session =
    await auth();

  if (
    !session?.user
  ) {
    redirect(
      '/transmissao/login',
    );
  }

  const user =
    session.user as TransmissionUser;

  if (
    !user.discordId
  ) {
    redirect(
      '/transmissao/login',
    );
  }

  const params =
    await searchParams;

  const error =
    params.erro;

  const errorMessage =
    error === 'sala'
      ? 'Código ou senha incorretos, ou a sala expirou.'
      : error === 'dados'
        ? 'Confira os dados informados.'
        : null;

  const displayName =
    user.name?.trim() ||
    'Usuário';

  const username =
    user.discordUsername
      ?.trim() ||
    '';

  return (
    <main className="relative z-[1] min-h-screen overflow-hidden px-4 pb-20 pt-[105px] sm:px-6">

      {/* ATMOSFERA */}
      <div className="pointer-events-none absolute left-1/2 top-[22%] h-[520px] w-[1000px] max-w-full -translate-x-1/2 rounded-full bg-accent-hot/[0.07] blur-[170px]" />

      <div className="pointer-events-none absolute -left-24 top-[38%] h-[300px] w-[300px] rounded-full border border-accent-hot/[0.04]" />

      <div className="pointer-events-none absolute -right-32 top-[18%] h-[430px] w-[430px] rounded-full border border-accent-hot/[0.04]" />

      <div className="relative mx-auto max-w-[1050px]">

        {/* TOPO */}
        <header className="mx-auto mb-8 max-w-[720px] text-center">

          <p className="text-[0.58rem] font-bold uppercase tracking-[0.32em] text-accent-hot">
            grudge // privado
          </p>

          <h1 className="mt-3 font-display text-[clamp(2.8rem,8vw,5rem)] uppercase tracking-[0.08em] text-text-main [text-shadow:0_0_45px_rgba(255,61,129,0.3)]">
            Transmissão
          </h1>

          <p className="mx-auto mt-4 max-w-[540px] text-[0.82rem] leading-relaxed text-text-dim">
            Crie uma sessão privada ou entre em uma transmissão
            existente usando o código e a senha.
          </p>

        </header>

        {/* USUÁRIO DISCORD */}
        <section className="mx-auto mb-8 flex max-w-[760px] flex-col gap-4 rounded-[22px] border border-line-soft bg-bg-mid/25 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-5">

          <div className="flex min-w-0 items-center gap-4">

            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-accent-hot/30 bg-bg-deep">

              {user.image ? (
                <Image
                  src={
                    user.image
                  }
                  alt={
                    displayName
                  }
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-xl text-accent-hot">
                  {displayName
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

            </div>

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <p className="truncate font-display text-xl text-text-main">
                  {displayName}
                </p>

                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />

              </div>

              {username && (
                <p className="mt-0.5 truncate text-[0.68rem] text-text-dim">
                  @{username}
                </p>
              )}

              <p className="mt-1 text-[0.52rem] font-bold uppercase tracking-[0.16em] text-accent-hot">
                conectado pelo Discord
              </p>

            </div>

          </div>

          <form
            action={async () => {
              'use server';

              await signOut({
                redirectTo:
                  '/transmissao/login',
              });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-xl border border-line-soft px-4 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-text-dim transition hover:border-red-400/40 hover:text-red-300 sm:w-auto"
            >
              trocar conta
            </button>
          </form>

        </section>

        {/* ERRO */}
        {errorMessage && (
          <div className="mx-auto mb-6 max-w-[760px] rounded-xl border border-red-400/20 bg-red-500/[0.07] px-5 py-3 text-center text-[0.75rem] text-red-300">
            {errorMessage}
          </div>
        )}

        {/* AÇÕES */}
        <div className="grid gap-5 lg:grid-cols-2">

          {/* CRIAR */}
          <section className="group relative overflow-hidden rounded-[28px] border border-line-soft bg-bg-mid/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-md transition duration-300 hover:border-accent-hot/35 sm:p-8">

            <div className="pointer-events-none absolute -right-20 -top-20 h-[230px] w-[230px] rounded-full bg-accent-hot/[0.09] blur-[85px]" />

            <div className="relative">

              <div className="flex items-start justify-between gap-5">

                <div>

                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.24em] text-accent-hot">
                    nova sessão
                  </p>

                  <h2 className="mt-2 font-display text-[2rem] text-text-main">
                    Criar sala
                  </h2>

                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-accent-hot/20 bg-accent-hot/[0.06] text-xl text-accent-hot transition group-hover:bg-accent-hot group-hover:text-bg-deep">
                  +
                </div>

              </div>

              <p className="mt-3 max-w-[380px] text-[0.75rem] leading-relaxed text-text-dim">
                Crie uma sala privada protegida por senha e compartilhe
                o código apenas com quem você quiser.
              </p>

              <form
                action={
                  createRoomAction
                }
                className="mt-7"
              >

                <label className="block">

                  <span className="mb-2 block text-[0.6rem] font-bold uppercase tracking-[0.14em] text-text-dim">
                    Senha da sala
                  </span>

                  <input
                    name="password"
                    type="password"
                    required
                    minLength={4}
                    maxLength={64}
                    autoComplete="new-password"
                    placeholder="Mínimo 4 caracteres"
                    className="h-12 w-full rounded-xl border border-line-soft bg-bg-deep/60 px-4 text-sm text-text-main outline-none transition placeholder:text-text-dim/35 focus:border-accent-hot/60"
                  />

                </label>

                <button
                  type="submit"
                  className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-hot px-5 py-3 text-[0.66rem] font-bold uppercase tracking-[0.13em] text-bg-deep transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  criar nova sala
                </button>

              </form>

            </div>

          </section>

          {/* ENTRAR */}
          <section className="group relative overflow-hidden rounded-[28px] border border-line-soft bg-bg-mid/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-md transition duration-300 hover:border-accent-hot/35 sm:p-8">

            <div className="relative">

              <div className="flex items-start justify-between gap-5">

                <div>

                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.24em] text-accent-hot">
                    acesso
                  </p>

                  <h2 className="mt-2 font-display text-[2rem] text-text-main">
                    Entrar na sala
                  </h2>

                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line-soft bg-bg-deep/40 text-lg text-text-dim transition group-hover:border-accent-hot/30 group-hover:text-accent-hot">
                  →
                </div>

              </div>

              <p className="mt-3 max-w-[380px] text-[0.75rem] leading-relaxed text-text-dim">
                Use o código e a senha fornecidos pelo responsável
                pela transmissão.
              </p>

              <form
                action={
                  joinRoomAction
                }
                className="mt-7 space-y-4"
              >

                <label className="block">

                  <span className="mb-2 block text-[0.6rem] font-bold uppercase tracking-[0.14em] text-text-dim">
                    Código
                  </span>

                  <input
                    name="code"
                    required
                    maxLength={6}
                    autoComplete="off"
                    placeholder="Ex: K7F2Q9"
                    className="h-12 w-full rounded-xl border border-line-soft bg-bg-deep/60 px-4 font-mono text-sm uppercase tracking-[0.2em] text-text-main outline-none transition placeholder:tracking-normal placeholder:text-text-dim/35 focus:border-accent-hot/60"
                  />

                </label>

                <label className="block">

                  <span className="mb-2 block text-[0.6rem] font-bold uppercase tracking-[0.14em] text-text-dim">
                    Senha
                  </span>

                  <input
                    name="password"
                    type="password"
                    required
                    maxLength={64}
                    autoComplete="current-password"
                    placeholder="Senha da sala"
                    className="h-12 w-full rounded-xl border border-line-soft bg-bg-deep/60 px-4 text-sm text-text-main outline-none transition placeholder:text-text-dim/35 focus:border-accent-hot/60"
                  />

                </label>

                <button
                  type="submit"
                  className="mt-1 flex min-h-12 w-full items-center justify-center rounded-xl border border-accent-hot/40 bg-accent-hot/[0.07] px-5 py-3 text-[0.66rem] font-bold uppercase tracking-[0.13em] text-accent-hot transition hover:-translate-y-0.5 hover:bg-accent-hot hover:text-bg-deep"
                >
                  entrar na transmissão
                </button>

              </form>

            </div>

          </section>

        </div>

        <div className="mx-auto mt-7 flex max-w-[760px] items-center justify-center gap-3 text-center">

          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line-soft" />

          <p className="shrink-0 text-[0.52rem] uppercase tracking-[0.17em] text-text-dim/45">
            sessões privadas • identidade Discord
          </p>

          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line-soft" />

        </div>

      </div>
    </main>
  );
}