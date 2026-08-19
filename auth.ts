import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';

import {
  getStaffByDiscordId,
  updateStaffDiscordProfile,
} from '@/lib/staff';

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Discord({
      authorization: {
        params: {
          scope: 'identify',
        },
      },
    }),
  ],

  pages: {
    /*
     * Mantemos o login administrativo
     * como página padrão do Auth.js.
     *
     * A transmissão terá seu próprio
     * botão/login usando signIn().
     */
    signIn: '/admin/login',
    error: '/admin/login',
  },

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    /*
     * QUALQUER conta Discord pode
     * autenticar agora.
     *
     * Isso NÃO libera o admin.
     * O admin depende de isStaff.
     */
    async signIn() {
      return true;
    },

    async jwt({
      token,
      account,
      profile,
      user,
    }) {
      /*
       * Dados recebidos no primeiro
       * login pelo Discord.
       */
      if (
        account?.provider ===
        'discord'
      ) {
        const discordId =
          typeof profile?.id ===
          'string'
            ? profile.id
            : typeof user?.id ===
                'string'
              ? user.id
              : '';

        if (discordId) {
          token.discordId =
            discordId;
        }

        /*
         * Username do Discord.
         */
        if (
          typeof profile?.username ===
          'string'
        ) {
          token.discordUsername =
            profile.username;
        }

        /*
         * Nome de exibição.
         *
         * Discord pode retornar
         * global_name.
         */
        const globalName =
          typeof profile?.global_name ===
            'string'
            ? profile.global_name.trim()
            : '';

        const username =
          typeof profile?.username ===
            'string'
            ? profile.username.trim()
            : '';

        const fallbackName =
          typeof user?.name ===
            'string'
            ? user.name.trim()
            : '';

        token.discordName =
          globalName ||
          username ||
          fallbackName ||
          'Usuário';

        /*
         * Avatar.
         *
         * O provider do Discord já
         * fornece user.image.
         */
        if (
          typeof user?.image ===
            'string'
        ) {
          token.discordImage =
            user.image;
        }
      }

      /*
       * Fallback para sessões
       * já existentes.
       */
      if (
        !token.discordId &&
        typeof token.sub ===
          'string'
      ) {
        token.discordId =
          token.sub;
      }

      const discordId =
        typeof token.discordId ===
        'string'
          ? token.discordId
          : '';

      /*
       * Verificação de STAFF.
       *
       * Usuário comum:
       * isStaff = false
       *
       * Staff cadastrada:
       * isStaff = true
       */
      if (discordId) {
        const staff =
          await getStaffByDiscordId(
            discordId,
          );

        if (staff) {
          token.isStaff =
            true;

          token.staffPermissions =
            staff.permissions;

          token.staffRole =
            staff.role;

          token.staffName =
            staff.name;

          /*
           * Mantém os dados da staff
           * atualizados com o Discord.
           */
          await updateStaffDiscordProfile({
            discordId,

            name:
              typeof token.discordName ===
              'string'
                ? token.discordName
                : null,

            image:
              typeof token.discordImage ===
              'string'
                ? token.discordImage
                : null,
          });
        } else {
          token.isStaff =
            false;

          token.staffPermissions =
            [];

          token.staffRole =
            '';

          token.staffName =
            '';
        }
      } else {
        token.isStaff =
          false;

        token.staffPermissions =
          [];

        token.staffRole =
          '';

        token.staffName =
          '';
      }

      return token;
    },

    async session({
      session,
      token,
    }) {
      if (!session.user) {
        return session;
      }

      const sessionUser =
        session.user as typeof session.user & {
          discordId?: string;

          discordUsername?: string;

          isStaff?: boolean;

          permissions?: string[];

          role?: string;
        };

      sessionUser.discordId =
        typeof token.discordId ===
        'string'
          ? token.discordId
          : undefined;

      sessionUser.discordUsername =
        typeof token.discordUsername ===
        'string'
          ? token.discordUsername
          : undefined;

      /*
       * Nome exibido na transmissão.
       */
      if (
        typeof token.discordName ===
          'string' &&
        token.discordName
      ) {
        sessionUser.name =
          token.discordName;
      }

      /*
       * Avatar exibido na transmissão.
       */
      if (
        typeof token.discordImage ===
          'string' &&
        token.discordImage
      ) {
        sessionUser.image =
          token.discordImage;
      }

      /*
       * Isso é o que o middleware
       * usa para proteger /admin.
       */
      sessionUser.isStaff =
        token.isStaff === true;

      sessionUser.permissions =
        Array.isArray(
          token.staffPermissions,
        )
          ? token.staffPermissions.map(
              String,
            )
          : [];

      sessionUser.role =
        typeof token.staffRole ===
          'string'
          ? token.staffRole
          : '';

      return session;
    },
  },
});