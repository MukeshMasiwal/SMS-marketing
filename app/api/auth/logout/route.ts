
import { createSuccessResponse } from "@/lib/utils/api";

export async function POST() {
  const response = createSuccessResponse({ success: true }, 200);
  
  // Delete the token cookie
  response.cookies.delete("token");
  
  return response;
}
