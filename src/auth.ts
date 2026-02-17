import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, { usersTable: users, accountsTable: accounts as any, sessionsTable: sessions as any, verificationTokensTable: verificationTokens }),
  session: { strategy: "jwt" },
  providers: [
    Google({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
    Credentials({
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase();
        const password = credentials?.password as string;
        if (email === "anibal.santos.msc@gmail.com" && password === "Time2Work") {
          let [user] = await db.select().from(users).where(eq(users.email, email));
          if (!user) { [user] = await db.insert(users).values({ email, name: "Anibal Santos" }).returning(); }
          return { id: user.id, email: user.email, name: user.name, image: user.image };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      if (allowedEmails.length === 0) return true;
      return allowedEmails.includes(user.email.toLowerCase());
    },
    async jwt({ token, user }) { if (user) token.id = user.id; return token; },
    async session({ session, token }) { if (session.user && token.id) session.user.id = token.id as string; return session; },
  },
  pages: { signIn: "/", error: "/" },
});
