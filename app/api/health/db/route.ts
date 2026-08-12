import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import mongoose from "mongoose";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          mongodb: "disconnected",
          error: "Database connection is not active"
        },
        { status: 500 }
      );
    }

    const dbName = conn.connection.db?.databaseName || conn.connection.name || "test";
    const userCount = await User.countDocuments();

    return NextResponse.json({
      success: true,
      mongodb: "connected",
      database: dbName,
      userCount
    });
  } catch (err: unknown) {
    const safeError = err instanceof Error ? err.message : "Failed to connect to database";
    return NextResponse.json(
      {
        success: false,
        mongodb: "disconnected",
        error: safeError
      },
      { status: 500 }
    );
  }
}
