"use client";

import { useState } from "react";
import {
  X,
  Upload,
  FileCode,
  FileText,
  Image as ImageIcon,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderArchive,
} from "lucide-react";
import { uploadDeploymentZip, Project } from "@/lib/api";

interface ZipFileItem {
  name: string;
  size: number;
  isDir: boolean;
}

interface ZipPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onDeploymentSuccess?: () => void;
}

export default function ZipPreviewModal({
  isOpen,
  onClose,
  project,
  onDeploymentSuccess,
}: ZipPreviewModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<ZipFileItem[]>([]);
  const [deploymentSlug, setDeploymentSlug] = useState("");

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("Only .zip files are allowed for deployment");
      setSelectedFile(null);
      setFileList([]);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setLoadingPreview(true);

    try {
      // Parse zip central directory header using Web API ArrayBuffer
      const items = await inspectZipFileEntries(file);
      setFileList(items);
    } catch (err: any) {
      console.error("Error reading zip entries", err);
      // Fallback
      setFileList([
        { name: "index.html", size: file.size, isDir: false },
      ]);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Inspect zip central directory header entries client-side
  const inspectZipFileEntries = async (file: File): Promise<ZipFileItem[]> => {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);
    const entries: ZipFileItem[] = [];

    // Simple Central Directory inspection or End of Central Directory search
    let offset = buffer.byteLength - 22;
    while (offset >= 0) {
      if (view.getUint32(offset, true) === 0x06054b50) {
        const cdOffset = view.getUint32(offset + 16, true);
        const cdEntries = view.getUint16(offset + 10, true);

        let ptr = cdOffset;
        for (let i = 0; i < cdEntries && ptr < buffer.byteLength - 46; i++) {
          if (view.getUint32(ptr, true) !== 0x02014b50) break;
          const uncompressedSize = view.getUint32(ptr + 24, true);
          const fileNameLen = view.getUint16(ptr + 28, true);
          const extraLen = view.getUint16(ptr + 30, true);
          const commentLen = view.getUint16(ptr + 32, true);

          const fileNameBytes = new Uint8Array(buffer, ptr + 46, fileNameLen);
          const fileName = new TextDecoder().decode(fileNameBytes);
          const isDir = fileName.endsWith("/");

          if (fileName && !fileName.startsWith("__MACOSX")) {
            entries.push({
              name: fileName,
              size: uncompressedSize,
              isDir,
            });
          }

          ptr += 46 + fileNameLen + extraLen + commentLen;
        }
        break;
      }
      offset--;
    }

    if (entries.length === 0) {
      entries.push({ name: "index.html", size: file.size, isDir: false });
    }

    return entries;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setError(null);
    setSuccessMsg(null);
    setUploading(true);

    try {
      const dep = await uploadDeploymentZip(
        project.id,
        selectedFile,
        deploymentSlug.trim() || undefined
      );

      setSuccessMsg(`Deployment "${dep.slug}" uploaded successfully! Status: ${dep.status}`);
      setTimeout(() => {
        if (onDeploymentSuccess) onDeploymentSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to upload zip deployment");
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "html" || ext === "htm") return <FileCode className="w-4 h-4 text-orange-500" />;
    if (ext === "css") return <FileCode className="w-4 h-4 text-blue-500" />;
    if (ext === "js" || ext === "ts" || ext === "jsx" || ext === "tsx")
      return <FileCode className="w-4 h-4 text-amber-500" />;
    if (["png", "jpg", "jpeg", "svg", "webp", "gif"].includes(ext || ""))
      return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    if (["json", "md", "txt"].includes(ext || ""))
      return <FileText className="w-4 h-4 text-slate-500" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-6 text-left relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-bold text-slate-900">
              New Zip Deployment
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Project: <span className="font-bold text-slate-800">{project.name}</span> ({project.slug})
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="flex flex-col gap-5">
          {/* File Picker */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Zip Archive (.zip only)
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFileList([]);
                    setError(null);
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer z-10"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove File</span>
                </button>
              )}
            </div>

            {selectedFile ? (
              <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left truncate">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatBytes(selectedFile.size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                    <span>Change File</span>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-slate-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-6 h-6 text-indigo-600" />
                <div className="flex flex-col items-center text-center">
                  <span className="text-xs font-semibold text-slate-700">
                    Click to browse or drop your .zip file
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Must contain index.html in root folder
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Client-Side File Preview Tree */}
          {loadingPreview && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Analyzing zip contents...</span>
            </div>
          )}

          {fileList.length > 0 && !loadingPreview && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Enclosed File Preview ({fileList.length})</span>
                <span>Size</span>
              </div>
              <div className="flex flex-col gap-1.5 font-mono text-xs">
                {fileList.slice(0, 15).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(item.name)}
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {item.isDir ? "dir" : formatBytes(item.size)}
                    </span>
                  </div>
                ))}
                {fileList.length > 15 && (
                  <span className="text-[10px] text-slate-400 font-sans pt-1">
                    ...and {fileList.length - 15} more files
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Deployment Name Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="depSlug" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Deployment Name
            </label>
            <input
              id="depSlug"
              type="text"
              placeholder="e.g. v1 or staging or release-1"
              value={deploymentSlug}
              onChange={(e) => setDeploymentSlug(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-xs font-mono font-medium"
            />
            <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-center gap-1.5 font-mono text-xs text-indigo-700 font-bold truncate mt-1">
              <span className="text-slate-400 font-normal">Live Route:</span>
              <span>/projects/{project.slug}/{deploymentSlug.trim().toLowerCase().replace(/\s+/g, "-") || "v1"}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Deploy Zip</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
