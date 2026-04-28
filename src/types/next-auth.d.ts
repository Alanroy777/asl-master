import { Role as PrismaRole } from "@prisma/client"
import NextAuth, { DefaultSession } from "next-auth"

// Re-export or redefine if necessary to ensuring visibility
export type Role = PrismaRole

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            role: Role
        } & DefaultSession["user"]
    }

    interface User {
        role: Role
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: Role
    }
}
