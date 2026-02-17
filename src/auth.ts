import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
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
    async signIn({ user, account }) {
      if (!user.email) return false;
      if (allowedEmails.length > 0 && !allowedEmails.includes(user.email.toLowerCase())) return false;
      // Ensure user exists in DB for Google sign-in
      if (account?.provider === "google") {
        const [existing] = await db.select().from(users).where(eq(users.email, user.email));
        if (!existing) {
          await db.insert(users).values({ email: user.email, name: user.name ?? null, image: user.image ?? null });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const [dbUser] = await db.select().from(users).where(eq(users.email, user.email!));
        if (dbUser) token.id = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) { if (session.user && token.id) session.user.id = token.id as string; return session; },
  },
  pages: { signIn: "/", error: "/" },
});
