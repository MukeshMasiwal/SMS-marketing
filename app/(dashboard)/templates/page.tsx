"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Eye,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  validateTemplateVariables,
  renderMessageTemplate,
  calculateSmsSegments,
  TEMPLATE_VARIABLES,
} from "@/lib/services/template-service";

interface TemplateItem {
  _id: string;
  name: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Editor Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Delete Dialog State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Textarea Ref for Cursor Insertion
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sample data for Live Preview
  const sampleContact = { name: "Rahul", phone: "9876543210" };
  const sampleCampaign = { name: "Diwali Promotion" };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/templates", { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.success && data.data?.templates) {
        setTemplates(data.data.templates);
      } else if (res.status === 401) {
        console.warn("Session expired or unauthorized when fetching templates");
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setName("");
    setMessage(
      "Hi {{name}}! 👋\n\nWe have a special offer for you from {{campaign_name}}.\nWe will contact you at {{phone}}."
    );
    setError("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (t: TemplateItem) => {
    setEditingTemplate(t);
    setName(t.name);
    setMessage(t.message);
    setError("");
    setIsDialogOpen(true);
  };

  // Insert Variable at Cursor Position
  const handleInsertVariable = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessage((prev) => prev + placeholder);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = message.substring(0, start);
    const textAfter = message.substring(end);

    const newMessage = textBefore + placeholder + textAfter;
    setMessage(newMessage);

    // Reposition cursor right after inserted placeholder
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  // Real-time Variable Validation
  const validation = useMemo(() => {
    return validateTemplateVariables(message);
  }, [message]);

  // Live Rendered Preview
  const renderedPreview = useMemo(() => {
    return renderMessageTemplate(message, sampleContact, sampleCampaign);
  }, [message]);

  // Real-time Segment Info calculated on RENDERED PREVIEW
  const segmentInfo = useMemo(() => {
    return calculateSmsSegments(renderedPreview);
  }, [renderedPreview]);

  // Handle Save Template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Template name is required");
    if (!message.trim()) return setError("Template message is required");
    if (!validation.valid) {
      return setError(
        `Unsupported variable(s): {{${validation.invalidVariables.join("}}, {{")}}}. Allowed: {{name}}, {{phone}}, {{campaign_name}}`
      );
    }

    setIsSubmitting(true);
    setError("");

    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate._id}` : "/api/templates";
      const method = editingTemplate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsDialogOpen(false);
        fetchTemplates();
      } else {
        if (res.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (res.status === 403) {
          setError("You do not have permission to manage this template.");
        } else {
          setError(data.error?.message || data.message || "Failed to save template");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the template");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Template
  const handleDeleteTemplate = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/templates/${deletingId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setDeletingId(null);
        fetchTemplates();
      }
    } catch (err) {
      console.error("Failed to delete template:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy Template Text
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 h-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <FileText className="h-8 w-8 text-indigo-500" />
            Message Templates
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Create reusable SMS templates with dynamic contact & campaign variables.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4 bg-zinc-950 p-2 border border-zinc-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search templates by name or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500"
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchTemplates}
          className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-sm">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-2" />
          <span>Loading templates...</span>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50 p-8">
          <FileText className="h-10 w-10 text-zinc-600 mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">No templates found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">
            {searchQuery
              ? "No templates match your search term."
              : "Create your first message template to easily personalize marketing campaigns."}
          </p>
          <Button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((t) => {
            const vInfo = validateTemplateVariables(t.message);
            const previewText = renderMessageTemplate(t.message, sampleContact, sampleCampaign);
            const seg = calculateSmsSegments(previewText);

            return (
              <div
                key={t._id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-lg group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div>
                      <h3 className="font-semibold text-zinc-100 text-base group-hover:text-indigo-400 transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Updated {new Date(t.updatedAt || t.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyText(t.message)}
                        title="Copy raw template text"
                        className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(t)}
                        title="Edit template"
                        className="h-7 w-7 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-900"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(t._id)}
                        title="Delete template"
                        className="h-7 w-7 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Raw Message Box */}
                  <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {t.message}
                  </div>

                  {/* Detected Variable Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {vInfo.foundVariables.map((varName) => (
                      <span
                        key={varName}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-900/50"
                      >
                        {`{{${varName}}}`}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {seg.charCount} chars · {seg.segmentCount} SMS ({seg.encoding})
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">Ready for campaigns</span>
                  <Button
                    onClick={() => (window.location.href = `/campaigns`)}
                    className="h-7 px-3 text-xs bg-zinc-900 hover:bg-zinc-800 text-indigo-400 border border-zinc-800 rounded-lg flex items-center gap-1.5"
                  >
                    <Megaphone className="h-3 w-3" />
                    Use in Campaign
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(val) => !isSubmitting && setIsDialogOpen(val)}>
        <DialogContent className="sm:max-w-[700px] bg-zinc-950 text-zinc-100 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              {editingTemplate ? "Edit Template" : "Create Message Template"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Design a reusable message template with dynamic variables for contact and campaign data.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-xl bg-rose-950/40 border border-rose-800/60 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSaveTemplate} className="space-y-5 py-2">
            {/* Template Name */}
            <div className="space-y-1.5">
              <Label htmlFor="template-name" className="text-xs font-semibold text-zinc-200">
                Template Name
              </Label>
              <Input
                id="template-name"
                placeholder="e.g. Diwali Promotion Announcement"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500"
              />
            </div>

            {/* Variable Insertion Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-zinc-200">
                  Message Content & Variables
                </Label>
                <span className="text-[11px] text-zinc-400">
                  Click variable to insert at cursor position
                </span>
              </div>

              <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-xs text-zinc-400 self-center font-medium mr-1">Insert:</span>
                {TEMPLATE_VARIABLES.map((v) => (
                  <Button
                    key={v.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertVariable(v.placeholder)}
                    className="h-7 text-xs font-mono border-indigo-900/60 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 hover:text-white transition-all shadow-sm"
                  >
                    + {v.placeholder}
                  </Button>
                ))}
              </div>

              <Textarea
                ref={textareaRef}
                rows={5}
                placeholder="Hi {{name}}, welcome to {{campaign_name}}!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={1600}
                disabled={isSubmitting}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-sm focus-visible:ring-indigo-500 font-sans resize-none"
              />
            </div>

            {/* Real-time Validation Alert */}
            {!validation.valid && (
              <div className="rounded-xl bg-rose-950/50 border border-rose-800/80 p-3 text-xs text-rose-200 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-rose-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Unsupported Variable Detected</span>
                </div>
                <p className="text-[11px] text-rose-300/90 leading-relaxed">
                  The placeholder(s){" "}
                  <strong className="font-mono text-white">
                    {`{{${validation.invalidVariables.join("}}, {{")}}}`}
                  </strong>{" "}
                  are not supported. Only <code className="text-indigo-300">{"{{name}}"}</code>,{" "}
                  <code className="text-indigo-300">{"{{phone}}"}</code>, and{" "}
                  <code className="text-indigo-300">{"{{campaign_name}}"}</code> are permitted.
                </p>
              </div>
            )}

            {/* Live Preview Card */}
            <div className="rounded-2xl border border-indigo-900/40 bg-indigo-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <Eye className="h-4 w-4 text-indigo-400" />
                  <span>Live Personalized Preview</span>
                </div>
                <span className="text-[10px] text-zinc-400">
                  Sample recipient: <strong className="text-zinc-200">{sampleContact.name}</strong> ({sampleContact.phone})
                </span>
              </div>

              {/* Rendered Text Output */}
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80 text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                {renderedPreview || <span className="text-zinc-500 italic">Preview will appear here...</span>}
              </div>

              {/* Segment Stats Bar */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 gap-2 pt-1">
                <div className="flex items-center gap-3">
                  <span>
                    Characters: <strong className="text-zinc-200">{segmentInfo.charCount}</strong>
                  </span>
                  <span>
                    SMS Segments: <strong className="text-indigo-300">{segmentInfo.segmentCount}</strong>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono">
                    {segmentInfo.encoding}
                  </span>
                </div>
                {segmentInfo.segmentCount > 1 && (
                  <span className="text-amber-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    Requires {segmentInfo.segmentCount} SMS credits per contact
                  </span>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
                className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !validation.valid}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    <span>{editingTemplate ? "Save Changes" : "Create Template"}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(val) => !isDeleting && setDeletingId(val ? deletingId : null)}>
        <DialogContent className="sm:max-w-[400px] bg-zinc-950 text-zinc-100 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-400">Delete Template</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-1">
              Are you sure you want to delete this message template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingId(null)}
              disabled={isDeleting}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteTemplate}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-medium"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
