import { NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";

export function createErrorResponse(message: string, code: string = "INTERNAL_ERROR", status: number = 500) {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  return NextResponse.json(response, { status });
}

export function createSuccessResponse<T>(data: T, status: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return NextResponse.json(response, { status });
}
