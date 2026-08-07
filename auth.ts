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
    signIn: '/admin/login',
    error: '/admin/login',
  },

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async signIn({ user, profile }) {
      const discordId =
        typeof profile?.id === 'string'
          ? profile.id
          : user.id;

      if (!discordId) {
        return false;
      }

      const staff =
        await getStaffByDiscordId(discordId);

      if (!staff) {
        return false;
      }

      await updateStaffDiscordProfile({
        discordId,

        name:
          typeof profile?.username === 'string'
            ? profile.username
            : user.name,

        image: user.image,
      });

      return true;
    },

    async jwt({
      token,
      account,
      profile,
    }) {
      // Primeiro login pelo Discord
      if (
        account?.provider === 'discord' &&
        typeof profile?.id === 'string'
      ) {
        token.discordId = profile.id;
      }

      // Fallback para sessão existente
      if (
        !token.discordId &&
        typeof token.sub === 'string'
      ) {
        token.discordId = token.sub;
      }

      const discordId =
        typeof token.discordId === 'string'
          ? token.discordId
          : '';

      if (discordId) {
        const staff =
          await getStaffByDiscordId(discordId);

        if (staff) {
          token.staffPermissions =
            staff.permissions;

          token.staffRole =
            staff.role;

          token.staffName =
            staff.name;
        } else {
          token.staffPermissions = [];
          token.staffRole = '';
        }
      }

      return token;
    },

    async session({
      session,
      token,
    }) {
      if (session.user) {
        const user =
          session.user as typeof session.user & {
            discordId?: string;
            permissions?: string[];
            role?: string;
          };

        user.discordId =
          typeof token.discordId === 'string'
            ? token.discordId
            : undefined;

        user.permissions =
          Array.isArray(
            token.staffPermissions,
          )
            ? token.staffPermissions.map(
                String,
              )
            : [];

        user.role =
          typeof token.staffRole === 'string'
            ? token.staffRole
            : 'Staff';
      }

      return session;
    },
  },
});