import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Package } from "@/lib/db/models/Package";
import { z } from "zod";

const PackageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be non-negative"),
  messageLimit: z.number().min(0, "Message limit must be non-negative"),
  features: z.array(z.string()).default([]),
  validity: z.number().min(1, "Validity must be at least 1 day").default(30),
  popular: z.boolean().default(false),
  buttonText: z.string().default("Get Started"),
  isActive: z.boolean().default(true)
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) {
      return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
    }
    
    await connectToDatabase();
    
    const packages = await Package.find({}).sort({ price: 1 });

    return NextResponse.json({
      success: true,
      data: { packages }
    });
  } catch (error: any) {
    console.error("Admin packages error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to load packages" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) {
      return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
    }
    
    const body = await req.json();
    const validatedData = PackageSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { success: false, error: { message: validatedData.error.issues[0].message } },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check for duplicate name
    const existing = await Package.findOne({ name: validatedData.data.name });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: "A package with this name already exists" } },
        { status: 409 }
      );
    }
    
    const newPackage = await Package.create(validatedData.data);

    return NextResponse.json({
      success: true,
      data: { package: newPackage }
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create package error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to create package" } },
      { status: 500 }
    );
  }
}
