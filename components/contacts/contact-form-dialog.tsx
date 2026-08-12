"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateContactSchema, CreateContactInput } from "@/lib/validations/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { toast } from "sonner";
import { IContact } from "@/lib/db/models/Contact";

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: IContact | null;
  onSuccess: () => void;
}

export function ContactFormDialog({ open, onOpenChange, contact, onSuccess }: ContactFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateContactInput>({
    resolver: zodResolver(CreateContactSchema) as unknown as import("react-hook-form").Resolver<CreateContactInput>,
    defaultValues: {
      name: contact?.name || "",
      phone: contact?.phone || "",
      email: contact?.email || "",
      tags: contact?.tags || [],
      status: contact?.status || "SUBSCRIBED",
    },
  });

  useEffect(() => {
    form.reset({
      name: contact?.name || "",
      phone: contact?.phone || "",
      email: contact?.email || "",
      tags: contact?.tags || [],
      status: contact?.status || "SUBSCRIBED",
    });
  }, [contact, form]);

  const onSubmit = async (data: CreateContactInput) => {
    setIsSubmitting(true);
    try {
      // Clean tags (comma separated to array if typed as string, but here we can handle simple parsing)
      let parsedTags = data.tags;
      if (typeof data.tags === "string") {
        parsedTags = (data.tags as string).split(",").map((t) => t.trim()).filter(Boolean);
      } else if (Array.isArray(data.tags) && data.tags.length > 0 && typeof data.tags[0] === "string" && data.tags[0].includes(",")) {
         parsedTags = data.tags[0].split(",").map((t) => t.trim()).filter(Boolean);
      }

      const payload = {
        ...data,
        tags: parsedTags,
      };

      const url = contact ? `/api/contacts/${contact._id}` : "/api/contacts";
      const method = contact ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Invalid contact details.");
      }

      toast.success(contact ? "Contact updated successfully." : "Contact added successfully.");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Unable to save contact.");
      } else {
        toast.error("Unable to save contact.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 text-zinc-50 border-zinc-800">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Contact" : "Add Contact"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {contact ? "Make changes to the contact here." : "Add a new subscriber to your audience."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-zinc-200 text-sm font-medium">Name</label>
            <Input placeholder="John Doe" className="bg-zinc-900 border-zinc-800" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-red-400 text-sm">{form.formState.errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-zinc-200 text-sm font-medium">Phone</label>
            <Input placeholder="+919876543210" className="bg-zinc-900 border-zinc-800" {...form.register("phone")} />
            {form.formState.errors.phone && <p className="text-red-400 text-sm">{form.formState.errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-zinc-200 text-sm font-medium">Email (Optional)</label>
            <Input placeholder="john@example.com" type="email" className="bg-zinc-900 border-zinc-800" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-zinc-200 text-sm font-medium">Tags (comma separated)</label>
            <Input 
              placeholder="vip, newsletter" 
              className="bg-zinc-900 border-zinc-800" 
              {...form.register("tags")}
            />
            {form.formState.errors.tags && <p className="text-red-400 text-sm">{form.formState.errors.tags.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-zinc-200 text-sm font-medium">Status</label>
            <select 
              className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register("status")}
            >
              <option value="SUBSCRIBED">Subscribed</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
            </select>
            {form.formState.errors.status && <p className="text-red-400 text-sm">{form.formState.errors.status.message}</p>}
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
