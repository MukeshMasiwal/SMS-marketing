"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateGroupSchema, CreateGroupInput } from "@/lib/validations/group";
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
import { IGroup } from "@/lib/db/models/Group";

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: IGroup | null;
  onSuccess: () => void;
}

export function GroupFormDialog({ open, onOpenChange, group, onSuccess }: GroupFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(CreateGroupSchema) as unknown as import("react-hook-form").Resolver<CreateGroupInput>,
    defaultValues: {
      name: group?.name || "",
      description: group?.description || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: group?.name || "",
      description: group?.description || "",
    });
  }, [group, form]);

  const onSubmit = async (data: CreateGroupInput) => {
    setIsSubmitting(true);
    try {
      const url = group ? `/api/groups/${group._id}` : "/api/groups";
      const method = group ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Invalid group details.");
      }

      toast.success(group ? "Group updated successfully." : "Group created successfully.");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Unable to save group.");
      } else {
        toast.error("Unable to save group.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 text-zinc-50 border-zinc-800">
        <DialogHeader>
          <DialogTitle>{group ? "Edit Group" : "Add Group"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {group ? "Make changes to the group here." : "Create a new group to organize your contacts."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-zinc-200 text-sm font-medium">Name</label>
            <Input placeholder="VIP Customers" className="bg-zinc-900 border-zinc-800" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-red-400 text-sm">{form.formState.errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-zinc-200 text-sm font-medium">Description (Optional)</label>
            <Input placeholder="Highest spending customers" className="bg-zinc-900 border-zinc-800" {...form.register("description")} />
            {form.formState.errors.description && <p className="text-red-400 text-sm">{form.formState.errors.description.message}</p>}
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
