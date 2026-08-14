import React, { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Sparkles,
  Save,
  ArrowRight,
  Smartphone,
  AlertCircle,
  Info,
  CheckCircle2,
  Loader2,
  User,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { getSmsStats, SmsStats } from "../../utils/sms";
import { Campaign } from "../../types";

interface SMSComposerFormData {
  name: string;
  message: string;
}

interface SMSComposerProps {
  initialData?: Partial<Campaign>;
  onSave: (data: { name: string; message: string }) => Promise<Campaign>;
  onContinue?: (campaignId: string) => void;
  isEditMode?: boolean;
}

export const SMSComposer: React.FC<SMSComposerProps> = ({
  initialData,
  onSave,
  onContinue,
  isEditMode = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SMSComposerFormData>({
    defaultValues: {
      name: initialData?.name || "",
      message: initialData?.message || "",
    },
  });

  const nameValue = watch("name");
  const messageValue = watch("message") || "";

  // Real-time SMS Statistics
  const stats: SmsStats = getSmsStats(messageValue);

  // Live preview variable substitution
  const previewText = messageValue
    .replace(/\{\{\s*name\s*\}\}/g, "Rahul")
    .replace(/\{\{\s*company\s*\}\}/g, "Example Company");

  // Insert personalization variable at cursor position
  const insertVariable = (variableStr: string) => {
    const textarea = textareaRef.current;
    const currentMessage = messageValue;

    if (!textarea) {
      setValue("message", currentMessage + variableStr, { shouldValidate: true });
      return;
    }

    const start = textarea.selectionStart ?? currentMessage.length;
    const end = textarea.selectionEnd ?? currentMessage.length;

    const newMessage =
      currentMessage.substring(0, start) + variableStr + currentMessage.substring(end);

    setValue("message", newMessage, { shouldValidate: true });

    const newCursorPos = start + variableStr.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSaveDraft = async (formData: SMSComposerFormData) => {
    try {
      setIsSaving(true);
      await onSave(formData);
      toast.success(
        isEditMode ? "Campaign draft updated successfully!" : "Campaign draft saved successfully!"
      );
      window.location.href = "/campaigns";
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async (formData: SMSComposerFormData) => {
    try {
      setIsContinuing(true);
      const savedCampaign = await onSave(formData);
      toast.success("Draft saved! Proceeding to recipient selection...");
      if (onContinue && savedCampaign._id) {
        onContinue(savedCampaign._id);
      } else if (savedCampaign._id) {
        window.location.href = `/campaigns/${savedCampaign._id}/edit?step=recipients`;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save campaign");
    } finally {
      setIsContinuing(false);
    }
  };

  // Register textarea with React Hook Form ref merging
  const { ref: formRef, ...messageRegisterRest } = register("message", {
    required: "Message is required",
    minLength: { value: 1, message: "Message cannot be empty" },
    maxLength: { value: 1600, message: "Message cannot exceed 1600 characters" },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: SMS Composer */}
        <div className="lg:col-span-7 space-y-6">
          <form className="space-y-6">
            {/* Campaign Name Field */}
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 space-y-4">
              <label htmlFor="campaignName" className="block text-sm font-medium text-zinc-200">
                Campaign Name <span className="text-red-400">*</span>
              </label>
              <input
                id="campaignName"
                type="text"
                placeholder="e.g. Diwali Flash Sale 2026"
                {...register("name", {
                  required: "Campaign name is required",
                  minLength: {
                    value: 2,
                    message: "Campaign name must be at least 2 characters",
                  },
                  maxLength: {
                    value: 100,
                    message: "Campaign name cannot exceed 100 characters",
                  },
                })}
                className={`w-full rounded-lg bg-zinc-900 border px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 ${
                  errors.name
                    ? "border-red-500/50 focus:ring-red-500/30"
                    : "border-white/10 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Message Field & Personalization */}
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label htmlFor="messageText" className="block text-sm font-medium text-zinc-200">
                  SMS Content <span className="text-red-400">*</span>
                </label>

                {/* Personalization Insertion Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-medium">Insert Variable:</span>
                  <button
                    type="button"
                    onClick={() => insertVariable("{{name}}")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 hover:text-white transition-colors"
                  >
                    <User className="h-3 w-3 text-blue-400" />
                    First Name
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable("{{company}}")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 hover:text-white transition-colors"
                  >
                    <Building2 className="h-3 w-3 text-emerald-400" />
                    Company
                  </button>
                </div>
              </div>

              <textarea
                id="messageText"
                rows={6}
                placeholder="Type your SMS message here... Use {{name}} or {{company}} to personalize."
                {...messageRegisterRest}
                ref={(e) => {
                  formRef(e);
                  textareaRef.current = e;
                }}
                className={`w-full rounded-lg bg-zinc-900 border p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 resize-y font-mono ${
                  errors.message
                    ? "border-red-500/50 focus:ring-red-500/30"
                    : "border-white/10 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />

              {errors.message && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.message.message}
                </p>
              )}

              {/* Contextual Warnings */}
              <div className="space-y-2 pt-2">
                {messageValue.trim().length === 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400">
                    <Info className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span>Message content is empty. Type a message above to get started.</span>
                  </div>
                )}

                {stats.encoding === "Unicode" && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Unicode Detected:</strong> Message contains special characters or emojis. Single segment capacity is reduced to 70 characters.
                    </span>
                  </div>
                )}

                {stats.segmentCount > 1 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                    <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Multipart Message:</strong> This message requires <strong>{stats.segmentCount} segments</strong>. Standard provider charges apply per segment per recipient.
                    </span>
                  </div>
                )}

                {stats.segmentCount >= 5 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Unusually Long Message:</strong> Messages exceeding 4 segments may experience deliverability delays or carrier restrictions.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSaving || isContinuing}
                onClick={handleSubmit(handleSaveDraft)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-white/10 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                ) : (
                  <Save className="h-4 w-4 text-zinc-400" />
                )}
                Save Draft
              </button>

              <button
                type="button"
                disabled={isSaving || isContinuing}
                onClick={handleSubmit(handleContinue)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {isContinuing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: SMS Statistics & Live Phone Preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* SMS Statistics Card */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              SMS Statistics
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-zinc-900 border border-white/5 space-y-1">
                <span className="text-xs text-zinc-400 font-medium">Characters</span>
                <p className="text-xl font-bold text-zinc-100">{stats.characterCount}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900 border border-white/5 space-y-1">
                <span className="text-xs text-zinc-400 font-medium">Segments</span>
                <p className="text-xl font-bold text-blue-400">{stats.segmentCount}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900 border border-white/5 space-y-1">
                <span className="text-xs text-zinc-400 font-medium">Encoding</span>
                <div className="pt-0.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      stats.encoding === "GSM-7"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {stats.encoding}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900 border border-white/5 space-y-1">
                <span className="text-xs text-zinc-400 font-medium">Remaining</span>
                <p className="text-xl font-bold text-emerald-400">{stats.remainingInSegment}</p>
              </div>
            </div>
          </div>

          {/* Smartphone Live Preview */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-400" />
              Live Phone Preview
            </h3>

            {/* Smartphone Container */}
            <div className="mx-auto max-w-[280px] rounded-[36px] border-[6px] border-zinc-800 bg-zinc-900 p-3 shadow-2xl space-y-3">
              {/* Phone Speaker & Notch */}
              <div className="flex items-center justify-between px-3 pt-1 text-[10px] text-zinc-400">
                <span>9:41</span>
                <div className="h-3 w-14 rounded-full bg-zinc-800" />
                <span>100%</span>
              </div>

              {/* Message Header */}
              <div className="border-b border-white/5 pb-2 text-center">
                <p className="text-xs font-medium text-zinc-300">SMS Marketing</p>
                <span className="text-[10px] text-zinc-500">Text Message</span>
              </div>

              {/* Message Bubble Area */}
              <div className="min-h-[180px] p-2 space-y-2 flex flex-col justify-end">
                <div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-blue-600 px-3.5 py-2.5 text-xs text-white shadow-md leading-relaxed whitespace-pre-wrap break-words">
                  {previewText.trim() ? (
                    previewText
                  ) : (
                    <span className="opacity-60 italic">
                      Your message preview will appear here...
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-zinc-500 self-start ml-1">Now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
