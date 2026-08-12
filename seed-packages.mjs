import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const PackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    messageLimit: { type: Number, required: true },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Package = mongoose.models.Package || mongoose.model("Package", PackageSchema);

const defaultPackages = [
  {
    name: "Free",
    slug: "free",
    price: 0,
    messageLimit: 1000,
    validity: 30,
    popular: false,
    buttonText: "Start Free",
    features: ["Basic Analytics", "Community Support", "Dummy Provider"],
    isActive: true
  },
  {
    name: "Starter",
    slug: "starter",
    price: 499,
    messageLimit: 10000,
    validity: 30,
    popular: false,
    buttonText: "Get Started",
    features: ["Basic Analytics", "Email Support", "Dummy Provider"],
    isActive: true
  },
  {
    name: "Growth",
    slug: "growth",
    price: 999,
    messageLimit: 25000,
    validity: 30,
    popular: true,
    buttonText: "Choose Growth",
    features: ["Advanced Analytics", "Priority Support", "Real SMS Provider"],
    isActive: true
  },
  {
    name: "Business",
    slug: "business",
    price: 1999,
    messageLimit: 100000,
    validity: 30,
    popular: false,
    buttonText: "Contact Sales",
    features: ["Advanced Analytics", "24/7 Phone Support", "Real SMS Provider", "Dedicated Account Manager"],
    isActive: true
  }
];

async function seedPackages() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log("Seeding packages...");
    
    // Attempt to drop old slug index if it exists
    await Package.collection.dropIndex('slug_1').catch(() => {
      console.log("No slug index found to drop or collection doesn't exist yet.");
    });
    
    for (const pkg of defaultPackages) {
      await Package.findOneAndUpdate(
        { name: pkg.name },
        { $set: pkg },
        { upsert: true, new: true }
      );
      console.log(`- Seeded package: ${pkg.name}`);
    }
    
    console.log("Finished seeding packages successfully.");

    // Migrate legacy users
    console.log("Migrating legacy users...");
    const freePackage = await Package.findOne({ name: "Free" });
    if (freePackage) {
      const UserSchema = new mongoose.Schema({ packageId: mongoose.Schema.Types.ObjectId, smsUsed: Number }, { strict: false });
      const User = mongoose.models.User || mongoose.model("User", UserSchema);
      
      const result = await User.updateMany(
        { packageId: { $exists: false } },
        { $set: { packageId: freePackage._id, smsUsed: 0 } }
      );
      console.log(`Migrated ${result.modifiedCount} legacy users to the Free package.`);
    }

  } catch (error) {
    console.error("Error seeding packages:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seedPackages();
