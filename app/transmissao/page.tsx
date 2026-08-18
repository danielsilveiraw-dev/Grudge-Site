import {
  createRoomAction,
  joinRoomAction,
} from './actions';

type PageProps = {
  searchParams: Promise<{
    erro?: string;
  }>;
};

export default async function TransmissionPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  const error =
    params.erro;

  function getErrorMessage() {
    switch (error) {
      case 'sala':
        return 'Código ou senha incorretos, ou a sala expirou.';

      case 'acesso':
        return 'Entre com o código e a senha para acessar esta sala.';

      case 'dados':
        return 'Confira os dados informados.';

      default:
        return null;
    }
  }

  const errorMessage =
    getErrorMessage();

  return (
    <main className="relative z-[1] min-h-screen px-4 pb-20 pt-[120px] sm:px-6">
      <div className="pointer-events-none absolute left-1/2 top-[20%] h-[430px] w-[850px] max-w-full -translate-x-1/2 rounded-full bg-accent-hot/[0.07] blur-[150px]" />

      <div className="relative mx-auto max-w-[1050px]">
        <header className="mx-auto mb-10 max-w-[680px] text-center">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.28em] text-accent-hot">
            grudge // privado
          </p>

          <h1 className="mt-3 font-display text-[clamp(2.8rem,8vw,5rem)] uppercase tracking-[0.08em] text-text-main [text-shadow:0_0_40px_rgba(255,61,129,0.3)]">
            Transmissão
          </h1>

          <p className="mx-auto mt-4 max-w-[560px] text-[0.85rem] leading-relaxed text-text-dim">
            Crie uma sala privada ou entre usando o código e a
            senha recebidos.
          </p>
        </header>

        {errorMessage && (
          <div className="mx-auto mb-6 max-w-[760px] rounded-xl border border-red-400/20 bg-red-500/[0.07] px-5 py-3 text-center text-[0.75rem] text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* CRIAR SALA */}
          <section className="relative overflow-hidden rounded-[26px] border border-line-soft bg-bg-mid/25 p-6 backdrop-blur-md sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-[190px] w-[190px] rounded-full bg-accent-hot/[0.08] blur-[75px]" />

            <div className="relative">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-accent-hot">
                nova sessão
              </p>

              <h2 className="mt-2 font-display text-3xl text-text-main">
                Criar sala
              </h2>

              <p className="mt-2 text-[0.76rem] leading-relaxed text-text-dim">
                Crie uma sala protegida por senha e compartilhe
                apenas o código com quem desejar.
              </p>

              <form
                action={createRoomAction}
                className="mt-7 space-y-4"
              >
                <label className="block">
                  <span className="mb-2 block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-text-dim">
                    Seu apelido
                  </span>

                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={28}
                    autoComplete="off"
                    placeholder="Ex: Dani"
                    className="h-12 w-full rounded-xl border border-line-soft bg-bg-deep/60 px-4 text-sm text-text-main outline-none transition placeholder:text-text-dim/40 focus:border-accent-hot/60"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-text-dim">
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
                    className="h-12 w-full rounded-xl border border-line-soft bg-bg-deep/60 px-4 text-sm text-text-main outline-none transition placeholder:text-text-dim/40 focus:border-accent-hot/60"
                  />
                </label>

                <button
                  type="submit"
                  className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-hot px-5 py-3 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-bg-deep transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Criar sala
                </button>
              </form>
            </div>
          </section>

          {/* ENTRAR NA SALA */}
          <section className="relative overflow-hidden rounded-[26px] border border-line-soft bg-bg-mid/25 p-6 backdrop-blur-md sm:p-8">
            <div className="relative">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-accent-hot">
                acesso
              </p>

              <h2 className="mt-2 font-display text-3xl text-text-main">
                Entrar na sala
              </h2>

              <p className="mt-2 text-[0.76rem] leading-relaxed text-text-dim">
                Informe o código, a senha e o nome que será
                exibido para os demais.
              </p>

              <form
                action={joinRoomAction}
                className="mt-7 space-y-4"
              >
                <label className="block">
                  <span className="mb-2 block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-text-dim">
                    Código
                  </span>

                  <input
                    name="code"
                    required
                    maxLength={6}
                    autoComplete="off"
                    placeholder="Ex: K7F2Q9"
                    className="h-12 w-full rounded-xl border border-line-soft bg-bg-deep/60 px-4 font-mono text-sm uppercase tracking-[0.2em] text-text-main outline-none transition placeholder:tracking-normal placeholder:text-text-dim/40 focus:border-accent-hot/60"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-text-dim">
                    Senha
                  </span>

                  <input
                    name="password"
                    type="password"
                    required
                    maxLength={64}
                    autoComplete="current-password"
                    placeholder="Senha da sala"
                    className="h-12 w-full rounded-xl border border-line-soft bg-bg-deep/60 px-4 text-sm text-text-main outline-none transition placeholder:text-text-dim/40 focus:border-accent-hot/60"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-text-dim">
                    Apelido
                  </span>

                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={28}
                    autoComplete="off"
                    placeholder="Ex: Luca"
                    className="h-12 w-full rounded-xl border border-line-soft bg-bg-deep/60 px-4 text-sm text-text-main outline-none transition placeholder:text-text-dim/40 focus:border-accent-hot/60"
                  />
                </label>

                <button
                  type="submit"
                  className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl border border-accent-hot/40 bg-accent-hot/[0.08] px-5 py-3 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent-hot transition hover:-translate-y-0.5 hover:bg-accent-hot hover:text-bg-deep"
                >
                  Entrar na sala
                </button>
              </form>
            </div>
          </section>
        </div>

        <p className="mt-6 text-center text-[0.62rem] text-text-dim/60">
          Esta página não aparece no menu público do Grudge.
        </p>
      </div>
    </main>
  );
}