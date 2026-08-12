import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Package } from "@/lib/db/models/Package";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const packages = await Package.find({ isActive: true }).sort({ price: 1 });

    return NextResponse.json({
      success: true,
      data: { packages }
    });
  } catch (error: any) {
    console.error("Packages API error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to load packages" } },
      { status: 500 }
    );
  }
}
