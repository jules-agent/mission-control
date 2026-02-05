import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const AUTH_EMAIL = process.env.AUTH_EMAIL || "ben@unpluggedperformance.com";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";

        if (email === AUTH_EMAIL && password === AUTH_PASSWORD) {
          return {
            id: "mission-control-user",
            name: "Ben",
            email: AUTH_EMAIL
          };
        }

        return null;
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      if (user?.name) {
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = typeof token.email === "string" ? token.email : session.user.email;
        session.user.name = typeof token.name === "string" ? token.name : session.user.name;
      }
      return session;
    }
  }
};
