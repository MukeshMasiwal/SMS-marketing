import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { UserLoginSchema } from "@/lib/validations/user";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validatedData = UserLoginSchema.safeParse(body);
    if (!validatedData.success) {
      return createErrorResponse(validatedData.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const { email, password } = validatedData.data;
    const normalizedEmail = email.trim().toLowerCase();

    await connectToDatabase();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return createErrorResponse("Invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    if (!user.isActive) {
      return createErrorResponse("Account is deactivated", "ACCOUNT_DISABLED", 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return createErrorResponse("Invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    if (!user.emailVerified) {
      return createErrorResponse("Please verify your email before logging in", "EMAIL_NOT_VERIFIED", 403);
    }

    // Create session token
    const token = await createToken({
      userId: user._id.toString(),
      role: user.role,
    });

    const response = createSuccessResponse({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }, 200);

    // Set cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("❌ Login route error:", err);
    return createErrorResponse(err?.message || "Failed to login", "INTERNAL_ERROR", 500);
  }
}
