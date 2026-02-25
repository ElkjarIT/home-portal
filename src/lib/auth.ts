import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      isAdmin: boolean;
      isAuthorized: boolean;
    };
  }
}

const ADMIN_GROUP_ID = process.env.ADMIN_GROUP_ID ?? "";
const USER_GROUP_ID = process.env.USER_GROUP_ID ?? "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.id = profile.sub;

        // Groups from id_token (requires "groupMembershipClaims": "SecurityGroup"
        // in the App Registration manifest)
        const groups: string[] =
          ((profile as Record<string, unknown>).groups as string[]) ?? [];

        token.isAdmin = groups.includes(ADMIN_GROUP_ID);
        token.isAuthorized =
          groups.includes(USER_GROUP_ID) || groups.includes(ADMIN_GROUP_ID);
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.isAdmin = (token.isAdmin as boolean) ?? false;
      session.user.isAuthorized = (token.isAuthorized as boolean) ?? false;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
