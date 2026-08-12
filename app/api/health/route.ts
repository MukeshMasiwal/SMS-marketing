import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectToDatabase();
    
    const isConnected = mongoose.connection.readyState === 1;

    return NextResponse.json({
      status: isConnected ? "ok" : "error",
      database: isConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to database",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
