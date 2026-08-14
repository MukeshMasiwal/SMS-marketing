import { createSuccessResponse } from "@/lib/utils/api";

export async function POST() {
  const response = createSuccessResponse({ success: true }, 200);
  
  // Clear the token cookie with matching attributes and zero maxAge
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  
  return response;
}
