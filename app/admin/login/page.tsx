import { redirect } from 'next/navigation';

import {
  auth,
  signIn,
  signOut,
} from '@/auth';

import { getStaffByDiscordId } from '@/lib/staff';

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function DiscordIcon({
  size = 22,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.9-1.52.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.26a18.27 18.27 0 0 0-5.48 0c-.17-.4-.4-.88-.62-1.26a.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.9 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.2.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.11c.36.7.78 1.37 1.23 2a.08.08 0 0 0 .08.03 19.83 19.83 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.09 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.09 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z" />
    </svg>
  );
}

function getErrorMessage(
  error?: string,
) {
  if (!error) {
    return null;
  }

  if (
    error === 'AccessDenied'
  ) {
    return 'Sua conta do Discord não possui acesso ao painel.';
  }

  return 'Não foi possível entrar com o Discord.';
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const session = await auth();

  const user =
    session?.user as
      | (typeof session.user & {
          discordId?: string;
        })
      | undefined;

  /*
   * Só redirecionamos para o painel
   * se a sessão pertence a um staff
   * que continua cadastrado.
   */
  if (user?.discordId) {
    const staff =
      await getStaffByDiscordId(
        user.discordId,
      );

    if (staff) {
      redirect(
        '/admin/calendario',
      );
    }
  }

  const params =
    await searchParams;

  const errorMessage =
    getErrorMessage(
      params.error,
    );

  return (
    <main className="relative z-[1] mx-auto flex min-h-screen max-w-[440px] flex-col items-center justify-center px-6 py-20">
      <section className="w-full overflow-hidden rounded-[24px] border border-line-soft bg-bg-mid/30 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-md">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent-hot to-transparent" />

        <div className="p-7 sm:p-9">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-line-soft bg-bg-deep/45 text-accent-soft">
              <DiscordIcon
                size={30}
              />
            </div>

            <h1 className="font-display text-3xl font-semibold text-text-main">
              painel da staff
            </h1>

            <p className="mx-auto mt-3 max-w-[320px] text-[0.8rem] leading-relaxed text-text-dim">
              Entre com sua conta do
              Discord. Apenas membros
              autorizados possuem
              acesso.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-xl border border-accent-hot/40 bg-accent-hot/10 px-4 py-3 text-center text-[0.78rem] text-accent-hot">
              {errorMessage}
            </div>
          )}

          <form
            action={async () => {
              'use server';

              /*
               * Remove primeiro qualquer
               * sessão antiga/incompleta.
               */
              await signOut({
                redirect: false,
              });

              await signIn(
                'discord',
                {
                  redirectTo:
                    '/admin/calendario',
                },
              );
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-5 py-3.5 text-[0.85rem] font-bold text-white transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <DiscordIcon />

              Entrar com Discord
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}