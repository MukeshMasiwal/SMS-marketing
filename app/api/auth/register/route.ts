import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { Package } from "@/lib/db/models/Package";
import { UserRegistrationSchema } from "@/lib/validations/user";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validatedData = UserRegistrationSchema.safeParse(body);
    if (!validatedData.success) {
      return createErrorResponse(validatedData.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const { name, email, password } = validatedData.data;

    await connectToDatabase();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return createErrorResponse("User with this email already exists", "USER_EXISTS", 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default first user to ADMIN, subsequent to USER. Or just use default logic
    const isFirstUser = (await User.countDocuments()) === 0;
    const role = isFirstUser ? "ADMIN" : "USER";

    // Find the Free package
    const freePackage = await Package.findOne({ name: "Free" });

    // Create user
    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      packageId: freePackage ? freePackage._id : undefined,
      smsUsed: 0
    });

    // Create session token
    const token = await createToken({
      userId: newUser._id.toString(),
      role: newUser.role,
    });

    const response = createSuccessResponse({
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }
    }, 201);

    // Set cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;
  } catch {
    return createErrorResponse("Failed to register user", "INTERNAL_ERROR", 500);
  }
}
