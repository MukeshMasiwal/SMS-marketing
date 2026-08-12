import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Package } from "@/lib/db/models/Package";
import mongoose from "mongoose";
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

export async function GET(
  req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id } = await params;
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) {
      return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
    }
    
    await connectToDatabase();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: { message: "Invalid package ID" } }, { status: 400 });
    }
    
    const pkg = await Package.findById(id);
    if (!pkg) {
      return NextResponse.json({ success: false, error: { message: "Package not found" } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { package: pkg }
    });
  } catch (error: any) {
    console.error("Admin package detail error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to load package details" } },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id } = await params;
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
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: { message: "Invalid package ID" } }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Check for duplicate name avoiding self
    const existing = await Package.findOne({ name: validatedData.data.name, _id: { $ne: id } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: "Another package with this name already exists" } },
        { status: 409 }
      );
    }
    
    const pkg = await Package.findByIdAndUpdate(
      id,
      validatedData.data,
      { new: true }
    );
    
    if (!pkg) {
      return NextResponse.json({ success: false, error: { message: "Package not found" } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { package: pkg }
    });
  } catch (error: any) {
    console.error("Update package error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update package" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id } = await params;
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) {
      return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: { message: "Invalid package ID" } }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const pkg = await Package.findByIdAndDelete(id);
    
    if (!pkg) {
      return NextResponse.json({ success: false, error: { message: "Package not found" } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { success: true }
    });
  } catch (error: any) {
    console.error("Delete package error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to delete package" } },
      { status: 500 }
    );
  }
}
