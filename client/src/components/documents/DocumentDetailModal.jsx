import React, { useEffect, useState } from 'react';
import { X, Download, Trash2, Clock, Shield, Tag, File, History, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useDocumentStore from '../../store/documentStore';
import { useAuthStore } from '../../store/authStore';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const DocumentDetailModal = ({ isOpen, onClose }) => {
  const selectedDocument = useDocumentStore((s) => s.selectedDocument);
  const { downloadDocument, deleteDocument, fetchVersions, fetchAuditLogs } = useDocumentStore();
  const { user } = useAuthStore();

  // Role check — DB stores uppercase: 'SUPER_ADMIN', 'ADMIN'
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [versions, setVersions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch versions and audit logs when document changes
  useEffect(() => {
    if (!selectedDocument?.id || !isOpen) return;
    setVersions([]);
    setAuditLogs([]);
    setShowVersions(false);
    setShowAudit(false);

    fetchVersions(selectedDocument.id).then(setVersions);
    if (isAdmin) {
      fetchAuditLogs(selectedDocument.id).then(setAuditLogs);
    }
  }, [selectedDocument?.id, isOpen]);

  if (!isOpen || !selectedDocument) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadDocument(
        selectedDocument.id,
        selectedDocument.originalFileName || selectedDocument.title + '.pdf'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${selectedDocument.title}"? It can be restored later.`)) return;
    try {
      setIsDeleting(true);
      await deleteDocument(selectedDocument.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-2xl bg-[#111827] rounded-2xl border border-white/[0.12] max-h-[90vh] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-[#1E293B]/40">
              <h3 className="text-lg font-semibold text-white font-heading">Document Details</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

              {/* Title & Actions */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="text-xl font-bold text-white mb-1 leading-tight">{selectedDocument.title}</h4>
                  <p className="text-sm text-slate-400">{selectedDocument.description || 'No description provided.'}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/30"
                  >
                    <Download size={15} />
                    {isDownloading ? 'Downloading…' : 'Download'}
                  </button>
                  {isAdmin && selectedDocument.status !== 'DELETED' && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1E293B]/50 border border-white/[0.06]">
                  <File className="text-cyan-400 flex-shrink-0" size={18} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">File Type</p>
                    <p className="text-sm font-semibold text-white truncate font-mono">{selectedDocument.mimeType || 'application/pdf'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1E293B]/50 border border-white/[0.06]">
                  <Tag className="text-emerald-400 flex-shrink-0" size={18} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Category</p>
                    <p className="text-sm font-semibold text-white font-mono">{(selectedDocument.category || '').replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1E293B]/50 border border-white/[0.06]">
                  <Shield className="text-indigo-400 flex-shrink-0" size={18} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Visibility</p>
                    <p className="text-sm font-semibold text-white">{selectedDocument.visibility || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1E293B]/50 border border-white/[0.06]">
                  <Clock className="text-amber-400 flex-shrink-0" size={18} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Uploaded</p>
                    <p className="text-sm font-semibold text-white font-mono">{formatDate(selectedDocument.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Extra stats row */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-[#1E293B]/50 border border-white/[0.06] text-center">
                  <p className="text-slate-500 font-medium text-xs mb-1">Size</p>
                  <p className="text-white font-bold font-mono text-xs">{formatSize(selectedDocument.fileSize)}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#1E293B]/50 border border-white/[0.06] text-center">
                  <p className="text-slate-500 font-medium text-xs mb-1">Version</p>
                  <p className="text-white font-bold">v{selectedDocument.version || 1}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#1E293B]/50 border border-white/[0.06] text-center">
                  <p className="text-slate-500 font-medium text-xs mb-1">Chunks</p>
                  <p className="text-white font-bold font-mono">{selectedDocument.chunkCount ?? '—'}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedDocument.tags?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 font-mono uppercase tracking-wider">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocument.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Version History (collapsible) */}
              <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                <button
                  onClick={() => setShowVersions(!showVersions)}
                  className="w-full flex items-center justify-between p-4 bg-[#1E293B]/60 hover:bg-[#1E293B] transition-colors"
                >
                  <div className="flex items-center gap-2 text-white text-sm font-semibold">
                    <History size={16} className="text-indigo-400" />
                    Version History
                    {versions.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 font-mono">{versions.length}</span>
                    )}
                  </div>
                  {showVersions ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>
                {showVersions && (
                  <div className="p-4 bg-[#111827] border-t border-white/[0.06]">
                    {versions.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-2 font-medium">No previous versions — this is the original.</p>
                    ) : (
                      <div className="space-y-2">
                        {versions.map((ver, idx) => (
                          <div key={ver.id || idx} className="flex items-center justify-between p-3 rounded-lg bg-[#1E293B]/50 border border-white/[0.06]">
                            <div>
                              <p className="text-white text-sm font-semibold">Version {ver.version}</p>
                              <p className="text-xs text-slate-400 font-mono">{ver.originalFileName}</p>
                              <p className="text-xs text-slate-500">{formatDate(ver.createdAt)}</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-300 font-mono">{formatSize(ver.fileSize)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Audit Log (admins only, collapsible) */}
              {isAdmin && (
                <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                  <button
                    onClick={() => setShowAudit(!showAudit)}
                    className="w-full flex items-center justify-between p-4 bg-[#1E293B]/60 hover:bg-[#1E293B] transition-colors"
                  >
                    <div className="flex items-center gap-2 text-white text-sm font-semibold">
                      <ClipboardList size={16} className="text-amber-400" />
                      Audit Log
                      {auditLogs.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 font-mono">{auditLogs.length}</span>
                    )}
                    </div>
                    {showAudit ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>
                  {showAudit && (
                    <div className="p-4 bg-[#111827] border-t border-white/[0.06]">
                      {auditLogs.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-2 font-medium">No audit entries found.</p>
                      ) : (
                        <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
                          {auditLogs.map((log, idx) => (
                            <div key={log.id || idx} className="flex items-start justify-between p-3 rounded-lg bg-[#1E293B]/50 border border-white/[0.06]">
                              <div>
                                <p className="text-sm font-semibold text-white">{log.action}</p>
                                <p className="text-xs text-slate-400">{log.user?.name || 'System'}</p>
                              </div>
                              <p className="text-xs text-slate-500 font-mono flex-shrink-0 ml-4">{formatDate(log.createdAt)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DocumentDetailModal;
