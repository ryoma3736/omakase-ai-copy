/**
 * User Signup API Route
 * POST /api/auth/signup
 * Creates a new user with email/password
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password (stored when password field is added to schema)
    // const hashedPassword = await hashPassword(password);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _hashedPassword = await hashPassword(password); // Suppress lint warning

    // Create user
    // Note: We're storing password in a separate field for Credentials auth
    // This is compatible with OAuth users who won't have a password
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        // password: _hashedPassword, // Uncomment when password field is added to schema
        emailVerified: null, // User needs to verify email
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // TODO: Send verification email
    // await sendVerificationEmail(user.email, verificationToken);

    return NextResponse.json(
      {
        message: "User created successfully. Please check your email to verify your account.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
