import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extend Session type
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      plan?: string;
      role?: "admin" | "member" | "viewer";
    } & DefaultSession["user"];
    strategy?: "database" | "jwt";
  }

  /**
   * Extend User type
   */
  interface User extends DefaultUser {
    id: string;
    email: string;
    name?: string;
    image?: string;
    plan?: string;
    role?: "admin" | "member" | "viewer";
  }
}

declare module "next-auth/jwt" {
  /**
   * Extend JWT type
   */
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    name?: string;
    picture?: string;
    plan?: string;
    role?: "admin" | "member" | "viewer";
  }
}
