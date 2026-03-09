"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { documentsApi } from "@/lib/api";
import type { Document } from "@/types";
import {
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Zap,
  Database,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

function StatusBadge({ status }: { status: Document["status"] }) {
  const map = {
    pending: {
      icon: Clock,
      label: "Pending",
      cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    processing: {
      icon: Loader2,
      label: "Processing",
      cls: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    completed: {
      icon: CheckCircle2,
      label: "Indexed",
      cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      cls: "text-red-400 bg-red-500/10 border-red-500/20",
    },
    deleted: {
      icon: XCircle,
      label: "Deleted",
      cls: "text-slate-500 bg-slate-800 border-slate-700",
    },
  };
  const { icon: Icon, label, cls } = map[status] || map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}
    >
      <Icon className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const params = useParams();
  const botId = params.botId as string;
  const { organization, accessToken } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [urlBatch, setUrlBatch] = useState("");
  const [importingUrls, setImportingUrls] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!organization || !accessToken) return;
    try {
      const data = await documentsApi.list(organization.id, botId, accessToken);
      setDocuments(data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [organization, accessToken, botId]);

  useEffect(() => {
    loadDocuments();
    const interval = setInterval(loadDocuments, 5000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!organization || !accessToken) return;
      setUploadError("");
      setUploading(true);
      setUploadProgress([]);

      for (const file of acceptedFiles) {
        setUploadProgress((prev) => [...prev, `Uploading ${file.name}...`]);
        try {
          const doc = await documentsApi.upload(organization.id, botId, file, accessToken);
          setDocuments((prev) => [doc, ...prev]);
          setUploadProgress((prev) =>
            prev.map((p) =>
              p.includes(file.name) ? `✓ ${file.name} uploaded` : p
            )
          );
        } catch (err: unknown) {
          setUploadError(err instanceof Error ? err.message : "Upload failed");
          setUploadProgress((prev) =>
            prev.map((p) =>
              p.includes(file.name) ? `✗ ${file.name} failed` : p
            )
          );
        }
      }
      setUploading(false);
      setTimeout(() => setUploadProgress([]), 3000);
    },
    [organization, accessToken, botId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 50 * 1024 * 1024,
  });

  const handleDelete = async (docId: string) => {
    if (!organization || !accessToken) return;
    if (!confirm("Delete this document and its indexed chunks?")) return;
    try {
      await documentsApi.delete(organization.id, botId, docId, accessToken);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      alert("Failed to delete document");
    }
  };

  const handleReprocess = async (docId: string) => {
    if (!organization || !accessToken) return;
    try {
      await documentsApi.reprocess(organization.id, botId, docId, accessToken);
      loadDocuments();
    } catch {
      alert("Failed to reprocess document");
    }
  };

  const handleImportUrls = async () => {
    if (!organization || !accessToken) return;
    const urls = urlBatch
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      setUploadError("Please add at least one manual URL");
      return;
    }

    try {
      setImportingUrls(true);
      setUploadError("");
      const res = await documentsApi.importUrls(organization.id, botId, urls, accessToken);
      setDocuments((prev) => [...res.documents, ...prev]);
      setUrlBatch("");
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to import manual URLs");
    } finally {
      setImportingUrls(false);
    }
  };

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);
  const indexedCount = documents.filter((d) => d.status === "completed").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/bots" className="hover:text-slate-300 transition-colors">
          Bots
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/dashboard/bots/${botId}`} className="hover:text-slate-300 transition-colors">
          Bot
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-300 font-medium">Documents</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">Knowledge Base</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Manual Library</h1>
          <p className="text-slate-400 mt-1 text-sm">Upload manuals or import batch URLs to train your bot</p>
        </div>
        <button
          onClick={loadDocuments}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-3 py-2 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      {documents.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{documents.length}</p>
              <p className="text-xs text-slate-500">Total files</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{indexedCount}</p>
              <p className="text-xs text-slate-500">Indexed</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Database className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{totalChunks.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Vector chunks</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all overflow-hidden ${
          isDragActive
            ? "border-indigo-500/60 bg-indigo-500/5"
            : "border-slate-700/60 hover:border-slate-600/60 bg-slate-900/40 hover:bg-slate-900/60"
        }`}
      >
        <input {...getInputProps()} />

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.5) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }} />
        </div>

        {uploading ? (
          <div className="relative flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-slate-300">Uploading files...</p>
            {uploadProgress.map((msg, i) => (
              <p key={i} className="text-xs text-slate-500">{msg}</p>
            ))}
          </div>
        ) : isDragActive ? (
          <div className="relative flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Upload className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="text-base font-bold text-indigo-300">Drop PDFs here</p>
          </div>
        ) : (
          <div className="relative flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
              <Upload className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-300">
                Drag & drop PDFs here
              </p>
              <p className="text-sm text-slate-500 mt-1">
                or <span className="text-indigo-400 hover:text-indigo-300">click to browse</span>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" /> Auto-indexed with AI
              </span>
              <span>·</span>
              <span>Max 50MB per file</span>
              <span>·</span>
              <span>PDF only</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800/60 p-5">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-sm font-semibold text-slate-300">Import manual URLs</h2>
          <button
            onClick={handleImportUrls}
            disabled={importingUrls}
            className="px-3 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg"
          >
            {importingUrls ? "Importing..." : "Import URLs"}
          </button>
        </div>
        <textarea
          value={urlBatch}
          onChange={(e) => setUrlBatch(e.target.value)}
          rows={5}
          placeholder={"https://manufacturer.com/manuals/model-a.pdf\nhttps://manufacturer.com/manuals/model-b.pdf"}
          className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-200 font-mono"
        />
        <p className="text-xs text-slate-500 mt-2">One URL per line. Imported URLs enter processing automatically.</p>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Documents list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800/60">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No documents uploaded yet</p>
          <p className="text-slate-500 text-sm mt-1">Upload PDFs above to train your bot</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    File
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Source
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Pages
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Chunks
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Size
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200 truncate max-w-xs">
                            {doc.original_file_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(doc.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-slate-400">
                        {doc.mime_type === "text/uri-list" ? "URL import" : "Upload"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={doc.status} />
                      {doc.error_message && (
                        <p className="text-xs text-red-400 mt-1 max-w-xs truncate">
                          {doc.error_message}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-300">
                        {doc.page_count ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-300">
                        {doc.chunk_count?.toLocaleString() ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-400">
                        {formatBytes(doc.file_size)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {(doc.status === "failed" || doc.status === "completed") && (
                          <button
                            onClick={() => handleReprocess(doc.id)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-500/10 border border-slate-700 hover:border-indigo-500/30 flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-all"
                            title="Reprocess"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 flex items-center justify-center text-slate-500 hover:text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
