import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const email = (credentials.email as string).trim().toLowerCase()

          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user || !user.passwordHash) return null

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          )

          if (!passwordMatch) return null

          return {
            id: user.id,
            email: user.email,
            name: user.displayName ?? user.firstName ?? null,
            role: user.role,
          }
        } catch (err) {
          console.error("[auth] authorize error:", err)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth, check whether the email already belongs to a
      // credentials-based account that hasn't linked Google yet.
      // If it has a password (credentials user) and no linked Google account,
      // block the sign-in so they don't get silently merged into the wrong account.
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: { where: { provider: "google" } } },
        })
        if (existing && existing.passwordHash && existing.accounts.length === 0) {
          // Credentials account exists with this email but no Google link yet.
          // Redirect to login with an informative error instead of auto-linking.
          return "/login?error=UseEmailPassword"
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})