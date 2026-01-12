import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import postgres from "postgres";
import type { User } from "@/app/lib/definitions";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || !account) return false;

      const name = user.name ?? null;
      const image = user.image ?? null;

      const existingUser = await sql<User[]>`
      SELECT id FROM users WHERE email = ${user.email}
    `;

      if (!existingUser.length) {
        await sql`
        INSERT INTO users (name, email, image, provider)
        VALUES (${name}, ${user.email}, ${image}, ${account.provider})
      `;
      }

      return true;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
});
