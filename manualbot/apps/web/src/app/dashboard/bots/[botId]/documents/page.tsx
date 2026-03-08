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
} from "lucide-react";
import { useDropzone } from "react-dropzone";

function StatusBadge({ status }: { status: Document["status"] }) {
  const map = {
    pending: { icon: Clock, label: "Pending", cls: "text-amber-600 bg-amber-50" },
    processing: { icon: Loader2, label: "Processing", cls: "text-blue-600 bg-blue-50" },
    completed: { icon: CheckCircle2, label: "Indexed", cls: "text-green-600 bg-green-50" },
    failed: { icon: XCircle, label: "Failed", cls: "text-red-600 bg-red-50" },
    deleted: { icon: XCircle, label: "Deleted", cls: "text-stone-400 bg-stone-50" },
  };
  const { icon: Icon, label, cls } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cls}`}>
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
    // Poll for status updates
    const interval = setInterval(loadDocuments, 5000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!organization || !accessToken) return;
      setUploadError("");
      setUploading(true);

      for (const file of acceptedFiles) {
        try {
          const doc = await documentsApi.upload(organization.id, botId, file, accessToken);
          setDocuments((prev) => [doc, ...prev]);
        } catch (err: unknown) {
          setUploadError(err instanceof Error ? err.message : "Upload failed");
        }
      }
      setUploading(false);
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

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400 mb-6">
        <Link href="/dashboard/bots" className="hover:text-stone-600">Bots</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/dashboard/bots/${botId}`} className="hover:text-stone-600">Bot</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-700">Documents</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Documents</h1>
          <p className="text-stone-500 mt-0.5">Upload PDFs to train your bot</p>
        </div>
        <button
          onClick={loadDocuments}
          className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 border border-stone-200 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-6 ${
          isDragActive
            ? "border-indigo-400 bg-indigo-50"
            : "border-stone-200 hover:border-stone-300 bg-white"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-stone-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-stone-400" />
            <p className="text-sm font-medium text-stone-700">
              {isDragActive ? "Drop PDFs here" : "Drag & drop PDFs here"}
            </p>
            <p className="text-xs text-stone-400">or click to browse · Max 50MB per file</p>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Documents list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-stone-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
          <FileText className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <p className="text-stone-500 text-sm">No documents uploaded yet</p>
          <p className="text-stone-400 text-xs mt-1">Upload PDFs above to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wider px-5 py-3">
                  File
                </th>
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wider px-5 py-3">
                  Pages
                </th>
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wider px-5 py-3">
                  Chunks
                </th>
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wider px-5 py-3">
                  Size
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-stone-800 truncate max-w-xs">
                          {doc.original_file_name}
                        </p>
                        <p className="text-xs text-stone-400">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={doc.status} />
                    {doc.error_message && (
                      <p className="text-xs text-red-500 mt-1 max-w-xs truncate">
                        {doc.error_message}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-stone-600">
                    {doc.page_count ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-stone-600">
                    {doc.chunk_count ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-stone-600">
                    {formatBytes(doc.file_size)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      {(doc.status === "failed" || doc.status === "completed") && (
                        <button
                          onClick={() => handleReprocess(doc.id)}
                          className="text-stone-400 hover:text-indigo-600 transition-colors p-1"
                          title="Reprocess"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-stone-400 hover:text-red-500 transition-colors p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
