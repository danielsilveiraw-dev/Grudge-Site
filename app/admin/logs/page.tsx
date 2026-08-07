import Link from 'next/link';

import { getLogs, type LogEntry } from '@/lib/logs';
import { requireAdminPage } from '@/lib/admin-access';

import AdminHeader from '../AdminHeader';

const LOGS_PER_PAGE = 10;

const CATEGORIES = [
  'Calendário',
  'Enigmas',
  'Músicas',
  'Streamers',
  'Acesso',
  'Outros',
] as const;

type LogCategory = (typeof CATEGORIES)[number];

type AdminLogsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
  }>;
};

function getLogCategory(log: LogEntry): LogCategory {
  const text = `${log.action} ${log.details ?? ''}`.toLocaleLowerCase(
    'pt-BR',
  );

  if (
    text.includes('evento') ||
    text.includes('calendário') ||
    text.includes('calendario')
  ) {
    return 'Calendário';
  }

  if (text.includes('enigma')) {
    return 'Enigmas';
  }

  if (
    text.includes('música') ||
    text.includes('musica')
  ) {
    return 'Músicas';
  }

  if (text.includes('streamer')) {
    return 'Streamers';
  }

  if (
    text.includes('login') ||
    text.includes('logout') ||
    text.includes('sessão') ||
    text.includes('sessao') ||
    text.includes('acesso')
  ) {
    return 'Acesso';
  }

  return 'Outros';
}

function createLogsUrl({
  page,
  query,
  category,
}: {
  page: number;
  query: string;
  category: string;
}) {
  const params = new URLSearchParams();

  if (query) {
    params.set('q', query);
  }

  if (category) {
    params.set('category', category);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const search = params.toString();

  return search
    ? `/admin/logs?${search}`
    : '/admin/logs';
}

export default async function AdminLogsPage({
  searchParams,
}: AdminLogsPageProps) {
  // Proteção real da página de logs
  await requireAdminPage('logs');

  const params = await searchParams;
  const logs = await getLogs();

  const query = params.q?.trim() ?? '';
  const normalizedQuery =
    query.toLocaleLowerCase('pt-BR');

  const selectedCategory = CATEGORIES.includes(
    params.category as LogCategory,
  )
    ? (params.category as LogCategory)
    : '';

  const requestedPage = Number.parseInt(
    params.page ?? '1',
    10,
  );

  const filteredLogs = logs.filter((log) => {
    const category = getLogCategory(log);

    const matchesCategory =
      !selectedCategory ||
      category === selectedCategory;

    const searchableText =
      `${log.action} ${log.details ?? ''}`.toLocaleLowerCase(
        'pt-BR',
      );

    const matchesQuery =
      !normalizedQuery ||
      searchableText.includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredLogs.length / LOGS_PER_PAGE,
    ),
  );

  const currentPage = Number.isFinite(
    requestedPage,
  )
    ? Math.min(
        Math.max(requestedPage, 1),
        totalPages,
      )
    : 1;

  const startIndex =
    (currentPage - 1) * LOGS_PER_PAGE;

  const visibleLogs = filteredLogs.slice(
    startIndex,
    startIndex + LOGS_PER_PAGE,
  );

  const firstVisibleLog =
    filteredLogs.length === 0
      ? 0
      : startIndex + 1;

  const lastVisibleLog = Math.min(
    startIndex + LOGS_PER_PAGE,
    filteredLogs.length,
  );

  return (
    <main className="relative z-[1] mx-auto max-w-[900px] px-4 pb-20 pt-[120px] sm:px-6">
      <AdminHeader
        title="logs"
        subtitle="histórico de tudo que foi feito no painel"
      />

      <section className="mb-6 rounded-[20px] border border-line-soft bg-bg-mid/30 p-5 backdrop-blur-sm sm:p-6">
        <form
          method="get"
          className="grid gap-4 sm:grid-cols-[1fr_220px_auto]"
        >
          <div>
            <label
              htmlFor="log-search"
              className="mb-1.5 block text-[0.68rem] uppercase tracking-[0.12em] text-text-dim"
            >
              pesquisar
            </label>

            <input
              id="log-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="pesquisar ação ou detalhes..."
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 px-4 py-3 text-[0.85rem] text-text-main placeholder:text-text-dim/60 focus:border-accent-hot focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="log-category"
              className="mb-1.5 block text-[0.68rem] uppercase tracking-[0.12em] text-text-dim"
            >
              categoria
            </label>

            <select
              id="log-category"
              name="category"
              defaultValue={selectedCategory}
              className="w-full rounded-xl border border-line-soft bg-bg-deep px-4 py-3 text-[0.85rem] text-text-main focus:border-accent-hot focus:outline-none"
            >
              <option value="">
                Todas as categorias
              </option>

              {CATEGORIES.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-accent-hot px-5 py-3 text-[0.8rem] font-bold text-bg-deep transition hover:brightness-110 sm:flex-none"
            >
              pesquisar
            </button>

            {(query || selectedCategory) && (
              <Link
                href="/admin/logs"
                className="rounded-xl border border-line-soft px-4 py-3 text-[0.8rem] text-text-dim transition hover:border-accent-hot hover:text-accent-hot"
              >
                limpar
              </Link>
            )}
          </div>
        </form>
      </section>

      <div className="mb-4 flex flex-col gap-2 text-[0.72rem] text-text-dim sm:flex-row sm:items-center sm:justify-between">
        <span>
          {filteredLogs.length === 0
            ? 'nenhum resultado'
            : `mostrando ${firstVisibleLog}–${lastVisibleLog} de ${filteredLogs.length} logs`}
        </span>

        <span>
          página {currentPage} de {totalPages}
        </span>
      </div>

      {visibleLogs.length === 0 ? (
        <section className="rounded-[20px] border border-dashed border-line-soft bg-bg-mid/20 px-6 py-12 text-center">
          <p className="text-[0.85rem] text-text-dim">
            {logs.length === 0
              ? 'nenhuma atividade registrada ainda.'
              : 'nenhum log corresponde aos filtros selecionados.'}
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleLogs.map((log) => {
            const category =
              getLogCategory(log);

            return (
              <li
                key={log.id}
                className="rounded-xl border border-line-soft bg-bg-deep/40 px-4 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-accent-hot/35 bg-accent-hot/10 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-accent-hot">
                        {category}
                      </span>

                      <p className="text-[0.9rem] text-text-main">
                        {log.action}
                      </p>
                    </div>

                    {log.details && (
                      <p className="mt-1.5 break-words text-[0.78rem] leading-relaxed text-text-dim">
                        {log.details}
                      </p>
                    )}
                  </div>

                  <time
                    dateTime={log.timestamp}
                    className="shrink-0 text-[0.7rem] text-text-dim"
                  >
                    {new Date(
                      log.timestamp,
                    ).toLocaleString('pt-BR')}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {filteredLogs.length > 0 &&
        totalPages > 1 && (
          <nav
            aria-label="Paginação dos logs"
            className="mt-7 flex flex-wrap items-center justify-center gap-2"
          >
            {currentPage > 1 ? (
              <Link
                href={createLogsUrl({
                  page: currentPage - 1,
                  query,
                  category:
                    selectedCategory,
                })}
                className="rounded-xl border border-line-soft px-4 py-2 text-[0.78rem] text-text-main transition hover:border-accent-hot hover:text-accent-hot"
              >
                ← anterior
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-xl border border-line-soft px-4 py-2 text-[0.78rem] text-text-dim opacity-35">
                ← anterior
              </span>
            )}

            <div className="flex flex-wrap justify-center gap-1.5">
              {Array.from(
                {
                  length: totalPages,
                },
                (_, index) => index + 1,
              ).map((page) => (
                <Link
                  key={page}
                  href={createLogsUrl({
                    page,
                    query,
                    category:
                      selectedCategory,
                  })}
                  aria-current={
                    page === currentPage
                      ? 'page'
                      : undefined
                  }
                  className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-[0.75rem] transition ${
                    page === currentPage
                      ? 'border-accent-hot bg-accent-hot font-bold text-bg-deep'
                      : 'border-line-soft text-text-dim hover:border-accent-hot hover:text-accent-hot'
                  }`}
                >
                  {page}
                </Link>
              ))}
            </div>

            {currentPage < totalPages ? (
              <Link
                href={createLogsUrl({
                  page: currentPage + 1,
                  query,
                  category:
                    selectedCategory,
                })}
                className="rounded-xl border border-line-soft px-4 py-2 text-[0.78rem] text-text-main transition hover:border-accent-hot hover:text-accent-hot"
              >
                próxima →
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-xl border border-line-soft px-4 py-2 text-[0.78rem] text-text-dim opacity-35">
                próxima →
              </span>
            )}
          </nav>
        )}
    </main>
  );
}