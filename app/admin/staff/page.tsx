import Image from 'next/image';

import AdminHeader from '../AdminHeader';

import {
  getStaffMembers,
  STAFF_PERMISSIONS,
} from '@/lib/staff';

import { requireMasterPage } from '@/lib/admin-access';

import {
  addStaffAction,
  updateStaffAction,
  deleteStaffAction,
} from './actions';

const PERMISSION_LABELS = {
  calendar: 'Calendário',
  riddles: 'Enigmas',
  music: 'Músicas',
  streamers: 'Streamers',
  logs: 'Logs',
  staffs: 'Staffs',
  support: 'Apoie',
} as const;

export default async function AdminStaffPage() {
  // Somente usuários com "all" podem administrar staffs
  const user = await requireMasterPage();

  const staffs = await getStaffMembers();

  return (
    <main className="relative z-[1] mx-auto max-w-[900px] px-6 pb-28 pt-[120px]">
      <AdminHeader
        title="gerenciar staff"
        subtitle="controle quem pode acessar o painel e quais permissões cada membro possui"
      />

      <section className="mb-10 rounded-[20px] border border-line-soft bg-bg-mid/30 p-7 backdrop-blur-sm">
        <h2 className="mb-5 font-display text-xl italic text-text-main">
          adicionar staff
        </h2>

        <form
          action={addStaffAction}
          className="flex flex-col gap-5"
        >
          <div>
            <label
              htmlFor="discordId"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              ID do Discord
            </label>

            <input
              id="discordId"
              name="discordId"
              type="text"
              inputMode="numeric"
              required
              placeholder="123456789012345678"
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
            />

            <p className="mt-1.5 text-[0.7rem] text-text-dim">
              Use o ID numérico da conta, não o @ do Discord.
            </p>
          </div>

          <div>
            <label
              htmlFor="role"
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              cargo
            </label>

            <input
              id="role"
              name="role"
              type="text"
              required
              placeholder="ex: Administrador, Moderador, Eventos..."
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
            />
          </div>

          <fieldset>
            <legend className="mb-3 text-[0.7rem] uppercase tracking-[0.12em] text-text-dim">
              permissões
            </legend>

            <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl border border-accent-hot/40 bg-accent-hot/10 p-4">
              <input
                name="all"
                type="checkbox"
                className="h-4 w-4 accent-accent-hot"
              />

              <div>
                <p className="text-[0.85rem] font-bold text-accent-hot">
                  Acesso total
                </p>

                <p className="mt-0.5 text-[0.7rem] text-text-dim">
                  Pode acessar tudo e gerenciar outros staffs.
                </p>
              </div>
            </label>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {STAFF_PERMISSIONS.map((permission) => (
                <label
                  key={permission}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-line-soft bg-bg-deep/30 p-3 transition hover:border-accent-hot"
                >
                  <input
                    type="checkbox"
                    name="permissions"
                    value={permission}
                    className="accent-accent-hot"
                  />

                  <span className="text-[0.78rem] text-text-main">
                    {PERMISSION_LABELS[permission]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="rounded-xl bg-accent-hot px-4 py-3 font-bold text-bg-deep transition hover:brightness-110"
          >
            liberar acesso
          </button>
        </form>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl italic text-text-main">
            staffs liberados
          </h2>

          <span className="text-[0.7rem] text-text-dim">
            {staffs.length}{' '}
            {staffs.length === 1
              ? 'membro'
              : 'membros'}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {staffs.map((staff) => {
            const master =
              staff.permissions.includes('all');

            const isCurrentUser =
              staff.discordId === user.discordId;

            return (
              <article
                key={staff.discordId}
                className="rounded-[20px] border border-line-soft bg-bg-deep/40 p-5"
              >
                <div className="flex items-center gap-4">
                  {staff.image ? (
                    <Image
                      src={staff.image}
                      alt={staff.name ?? 'Staff'}
                      width={58}
                      height={58}
                      className="h-[58px] w-[58px] shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-2xl border border-line-soft bg-bg-mid/50 font-display text-xl text-accent-soft">
                      {(staff.name ?? '?')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-display text-xl text-text-main">
                        {staff.name ??
                          'Ainda não entrou'}
                      </h3>

                      {master && (
                        <span className="rounded-full border border-accent-hot/40 bg-accent-hot/10 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-accent-hot">
                          master
                        </span>
                      )}

                      {isCurrentUser && (
                        <span className="rounded-full border border-line-soft px-2.5 py-1 text-[0.6rem] uppercase tracking-wide text-text-dim">
                          você
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-[0.8rem] text-accent-soft">
                      {staff.role}
                    </p>

                    <p className="mt-1 font-mono text-[0.65rem] text-text-dim">
                      {staff.discordId}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {master ? (
                    <span className="rounded-full border border-accent-hot/30 px-2.5 py-1 text-[0.65rem] text-accent-hot">
                      Acesso total
                    </span>
                  ) : (
                    staff.permissions.map(
                      (permission) => (
                        <span
                          key={permission}
                          className="rounded-full border border-line-soft px-2.5 py-1 text-[0.65rem] text-text-dim"
                        >
                          {PERMISSION_LABELS[
                            permission
                          ]}
                        </span>
                      ),
                    )
                  )}
                </div>

                <details className="mt-5 border-t border-line-soft pt-4">
                  <summary className="cursor-pointer text-[0.72rem] uppercase tracking-[0.1em] text-text-dim transition hover:text-accent-hot">
                    editar acesso
                  </summary>

                  <form
                    action={updateStaffAction}
                    className="mt-4 flex flex-col gap-4"
                  >
                    <input
                      type="hidden"
                      name="discordId"
                      value={staff.discordId}
                    />

                    <div>
                      <label className="mb-1.5 block text-[0.68rem] uppercase tracking-[0.1em] text-text-dim">
                        cargo
                      </label>

                      <input
                        name="role"
                        type="text"
                        required
                        defaultValue={staff.role}
                        className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-accent-hot/30 bg-accent-hot/5 p-3">
                      <input
                        name="all"
                        type="checkbox"
                        defaultChecked={master}
                        className="accent-accent-hot"
                      />

                      <span className="text-[0.78rem] text-text-main">
                        Acesso total
                      </span>
                    </label>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {STAFF_PERMISSIONS.map(
                        (permission) => (
                          <label
                            key={permission}
                            className="flex items-center gap-2 rounded-lg border border-line-soft p-2.5"
                          >
                            <input
                              type="checkbox"
                              name="permissions"
                              value={permission}
                              defaultChecked={
                                !master &&
                                staff.permissions.includes(
                                  permission,
                                )
                              }
                              className="accent-accent-hot"
                            />

                            <span className="text-[0.72rem] text-text-dim">
                              {
                                PERMISSION_LABELS[
                                  permission
                                ]
                              }
                            </span>
                          </label>
                        ),
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-fit rounded-xl bg-accent-hot px-4 py-2 text-[0.75rem] font-bold text-bg-deep transition hover:brightness-110"
                    >
                      salvar alterações
                    </button>
                  </form>

                  {!isCurrentUser && (
                    <form
                      action={deleteStaffAction}
                      className="mt-3"
                    >
                      <input
                        type="hidden"
                        name="discordId"
                        value={staff.discordId}
                      />

                      <button
                        type="submit"
                        className="rounded-xl border border-line-soft px-4 py-2 text-[0.72rem] text-text-dim transition hover:border-accent-hot hover:text-accent-hot"
                      >
                        remover acesso
                      </button>
                    </form>
                  )}
                </details>

                <div className="mt-4 border-t border-line-soft/50 pt-3 text-[0.62rem] leading-relaxed text-text-dim">
                  Adicionado por{' '}
                  {staff.addedBy ?? 'sistema'}
                  {' • '}
                  {new Date(
                    staff.createdAt,
                  ).toLocaleDateString('pt-BR')}

                  {staff.lastLoginAt && (
                    <>
                      {' • '}último acesso{' '}
                      {new Date(
                        staff.lastLoginAt,
                      ).toLocaleString('pt-BR')}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}