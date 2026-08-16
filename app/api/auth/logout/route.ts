import { createSuccessResponse } from "@/lib/utils/api";

export async function POST() {
  const response = createSuccessResponse({ success: true }, 200);
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  };

  response.cookies.set("token", "", cookieOptions);
  response.cookies.set("accessToken", "", cookieOptions);
  response.cookies.set("refreshToken", "", cookieOptions);
  
  return response;
}
