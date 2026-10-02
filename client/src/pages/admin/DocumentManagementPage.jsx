import React, { useEffect, useState } from 'react';
import {
  Search, Plus, FileText, Download, Eye, RefreshCw,
  Trash2, RotateCcw, Brain, Zap, AlertCircle, CheckCircle2,
  Clock, ChevronDown, ChevronUp, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useDocumentStore from '../../store/documentStore';
import DocumentUploadModal from '../../components/documents/DocumentUploadModal';
import DocumentDetailModal from '../../components/documents/DocumentDetailModal';
import { useAuthStore } from '../../store/authStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const STATUS_STYLES = {
  READY:      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  UPLOADED:   'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  PROCESSING: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  FAILED:     'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  DELETED:    'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  ARCHIVED:   'bg-slate-500/15 text-slate-400 border border-slate-500/30',
};

const EMBEDDING_STYLES = {
  COMPLETED:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  PROCESSING: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  PENDING:    'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  FAILED:     'bg-rose-500/15 text-rose-400 border border-rose-500/30',
};

const CATEGORIES = [
  'ADMISSION', 'ACADEMICS', 'STUDENT_HANDBOOK', 'FACULTY_HANDBOOK',
  'EXAMINATION', 'FEES', 'HOSTEL', 'LIBRARY', 'PLACEMENT',
  'SCHOLARSHIP', 'TRANSPORTATION', 'POLICIES', 'LABORATORY',
  'RESEARCH', 'EVENTS', 'OTHER',
];

// ─── Small stat card ──────────────────────────────────────────────────────────

const StatCard = ({ label, value, color = 'text-white', icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#111827] p-5 rounded-xl border border-white/[0.08] shadow-sm"
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      {Icon && <Icon size={16} className="text-slate-500" />}
    </div>
    <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
  </motion.div>
);

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ value, total, color = 'bg-indigo-500' }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-400 font-medium mb-1 font-mono">
        <span>{value} / {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden border border-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

// ─── AI Indexing Panel ────────────────────────────────────────────────────────

const AIIndexingPanel = ({ indexingStatus, isIndexing, onIndexAll, onRetryFailed, onRefresh }) => {
  const [expanded, setExpanded] = useState(true);

  const chunks    = indexingStatus?.chunks || {};
  const docs      = indexingStatus?.documents || {};
  const hnswOk    = indexingStatus?.hnswIndex?.exists;
  const completed = docs.COMPLETED || 0;
  const pending   = docs.PENDING   || 0;
  const failed    = docs.FAILED    || 0;
  const totalDocs = completed + pending + failed + (docs.PROCESSING || 0);

  return (
    <div className="bg-[#111827] rounded-xl border border-white/[0.08] overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-[#1E293B]/60 hover:bg-[#1E293B] transition-colors border-b border-white/[0.08]"
      >
        <div className="flex items-center gap-3">
          <Brain size={18} className="text-indigo-400" />
          <span className="text-white font-semibold text-sm">AI Knowledge Base — Indexing Status</span>
          {hnswOk && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              HNSW ✓
            </span>
          )}
          {chunks.total > 0 && chunks.embedded === chunks.total && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              Fully Indexed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRefresh(); }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
            title="Refresh AI Status"
          >
            <RefreshCw size={15} />
          </button>
          {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-5 space-y-5 text-slate-200 text-sm border-t border-white/[0.06]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                  <span>Document Embedding Progress</span>
                  <span>{completed} / {totalDocs} docs</span>
                </div>
                <ProgressBar value={completed} total={totalDocs} color="bg-gradient-to-r from-indigo-500 to-cyan-400" />
                <div className="flex flex-wrap gap-3 text-xs pt-1 font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> {completed} Indexed
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> {pending + (docs.PROCESSING || 0)} Pending
                  </span>
                  {failed > 0 && (
                    <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-rose-400" /> {failed} Failed
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                  <span>pgvector Text Chunks</span>
                  <span>{chunks.embedded ?? 0} / {chunks.total ?? 0}</span>
                </div>
                <ProgressBar value={chunks.embedded ?? 0} total={chunks.total ?? 0} color="bg-emerald-500" />
                <div className="flex items-center justify-between text-xs pt-1 text-slate-400 font-mono">
                  <span>Embedding Dimensions: 768</span>
                  <span className="text-cyan-400">HNSW Cosine Index</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                <span>Background indexing processor runs automatically on upload.</span>
              </div>
              <div className="flex items-center gap-2">
                {failed > 0 && (
                  <button
                    onClick={onRetryFailed}
                    disabled={isIndexing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw size={13} />
                    <span>Retry {failed} Failed</span>
                  </button>
                )}
                <button
                  onClick={() => onIndexAll(false)}
                  disabled={isIndexing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Zap size={13} />
                  <span>Index Pending</span>
                </button>
                <button
                  onClick={() => { if (window.confirm('Re-index all documents? This will regenerate all vector embeddings.')) onIndexAll(true); }}
                  disabled={isIndexing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.12] bg-[#1E293B] hover:bg-[#334155] text-slate-300 disabled:opacity-50 transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>Force Re-index All</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



// ─── Main Page ────────────────────────────────────────────────────────────────

const DocumentManagementPage = () => {
  const {
    documents,
    stats,
    indexingStatus,
    isLoading,
    isIndexing,
    filters,
    pagination,
    error,
    fetchDocuments,
    fetchStats,
    fetchIndexingStatus,
    setFilters,
    setSelectedDocument,
    downloadDocument,
    deleteDocument,
    restoreDocument,
    indexDocument: indexOneDocument,
    indexAll,
    retryFailed,
  } = useDocumentStore();

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [indexingMsg, setIndexingMsg] = useState(null);

  useEffect(() => {
    fetchDocuments();
    if (isAdmin) {
      fetchStats();
      fetchIndexingStatus();
    }
  }, []);

  const handleSearch         = (e)  => setFilters({ search: e.target.value, page: 1 });
  const handleCategoryChange = (e)  => setFilters({ category: e.target.value, page: 1 });
  const handleStatusChange   = (e)  => setFilters({ status: e.target.value, page: 1 });
  const handlePageChange     = (pg) => setFilters({ page: pg });

  const openDetail = (doc) => { setSelectedDocument(doc); setIsDetailModalOpen(true); };

  const handleDownload = async (doc) => {
    try {
      setActionLoading(doc.id);
      await downloadDocument(doc.id, doc.originalFileName || doc.title + '.pdf');
    } finally { setActionLoading(null); }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"? This can be restored later.`)) return;
    try { setActionLoading(doc.id); await deleteDocument(doc.id); }
    finally { setActionLoading(null); }
  };

  const handleRestore = async (doc) => {
    try { setActionLoading(doc.id); await restoreDocument(doc.id); }
    finally { setActionLoading(null); }
  };

  const handleIndexOne = async (doc) => {
    try {
      setActionLoading(doc.id);
      setIndexingMsg(`Indexing "${doc.title}"...`);
      const result = await indexOneDocument(doc.id, false);
      setIndexingMsg(`✅ "${doc.title}" indexed: ${result?.embedded ?? 0} chunks embedded`);
      setTimeout(() => setIndexingMsg(null), 4000);
    } catch (err) {
      setIndexingMsg(`❌ Failed to index "${doc.title}"`);
      setTimeout(() => setIndexingMsg(null), 4000);
    } finally { setActionLoading(null); }
  };

  const handleIndexAll = async (force) => {
    try {
      setIndexingMsg(force ? 'Force re-indexing all documents...' : 'Indexing pending documents...');
      const result = await indexAll(force);
      setIndexingMsg(`✅ Done: ${result?.embedded ?? 0} chunks embedded`);
      setTimeout(() => setIndexingMsg(null), 5000);
    } catch {
      setIndexingMsg('❌ Indexing failed');
      setTimeout(() => setIndexingMsg(null), 4000);
    }
  };

  const handleRetryFailed = async () => {
    try {
      setIndexingMsg('Retrying failed documents...');
      await retryFailed();
      setIndexingMsg('✅ Retry complete');
      setTimeout(() => setIndexingMsg(null), 4000);
    } catch {
      setIndexingMsg('❌ Retry failed');
      setTimeout(() => setIndexingMsg(null), 4000);
    }
  };

  // Safe stats values
  const totalDocuments = stats?.totalDocuments ?? '—';
  const totalStorage   = stats ? formatSize(stats.totalStorage) : '—';
  const readyCount     = stats?.byStatus?.find(s => s.status === 'READY')?.count   ?? '—';
  const failedCount    = stats?.byStatus?.find(s => s.status === 'FAILED')?.count  ?? 0;

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">Document Management</h1>
          <p className="text-slate-400 text-sm mt-1">AI Knowledge Base — Enterprise Document System</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchDocuments(); if (isAdmin) { fetchStats(); fetchIndexingStatus(); } }}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
            >
              <Plus size={18} />
              <span>Upload Document</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Indexing notification ── */}
      <AnimatePresence>
        {indexingMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-sm text-indigo-300 font-medium shadow-sm"
          >
            {isIndexing && <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
            {indexingMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats Cards ── */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Documents" value={totalDocuments} icon={FileText} />
          <StatCard label="Total Storage"   value={totalStorage}   icon={BarChart3} />
          <StatCard label="Ready"           value={readyCount}     color="text-emerald-400" icon={CheckCircle2} />
          <StatCard label="Failed"          value={failedCount}    color={failedCount > 0 ? 'text-rose-400' : 'text-slate-500'} icon={AlertCircle} />
        </div>
      )}

      {/* ── AI Indexing Panel ── */}
      {isAdmin && (
        <AIIndexingPanel
          indexingStatus={indexingStatus}
          isIndexing={isIndexing}
          onIndexAll={handleIndexAll}
          onRetryFailed={handleRetryFailed}
          onRefresh={fetchIndexingStatus}
        />
      )}

      {/* ── Document Table ── */}
      <div className="bg-[#111827] rounded-xl border border-white/[0.08] shadow-sm overflow-hidden">

        {/* Filter Bar */}
        <div className="p-4 border-b border-white/[0.08] bg-[#1E293B]/40 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              id="doc-search"
              placeholder="Search by title or description..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[#0B1120]/80 border border-white/[0.12] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <select
              id="doc-category-filter"
              value={filters.category}
              onChange={handleCategoryChange}
              className="px-3 py-2 text-sm bg-[#0B1120]/80 border border-white/[0.12] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
            <select
              id="doc-status-filter"
              value={filters.status}
              onChange={handleStatusChange}
              className="px-3 py-2 text-sm bg-[#0B1120]/80 border border-white/[0.12] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="UPLOADED">Uploaded</option>
              <option value="PROCESSING">Processing</option>
              <option value="READY">Ready</option>
              <option value="FAILED">Failed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-medium">Loading documents...</p>
            </div>
          ) : error ? (
            <div className="p-12 flex flex-col items-center justify-center text-rose-400">
              <p className="text-lg font-bold mb-2">Failed to load documents</p>
              <p className="text-sm text-slate-400">{error}</p>
              <button onClick={fetchDocuments} className="mt-4 text-indigo-400 hover:underline font-semibold text-sm">Try again</button>
            </div>
          ) : !Array.isArray(documents) || documents.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <FileText size={48} className="mb-4 opacity-30 text-slate-400" />
              <p className="text-lg font-semibold text-slate-300 mb-2">No documents found</p>
              {isAdmin && (
                <button onClick={() => setIsUploadModalOpen(true)} className="text-indigo-400 hover:underline font-semibold text-sm mt-2">
                  Upload your first document
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#1E293B]/40 text-slate-400 uppercase tracking-wider text-[11px] font-semibold font-mono">
                  <th className="p-4">Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">AI Index</th>
                  <th className="p-4">Chunks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                <AnimatePresence>
                  {documents.map((doc) => (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="text-indigo-400 flex-shrink-0" size={18} />
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate max-w-[200px]">{doc.title}</p>
                            {doc.description && (
                              <p className="text-xs text-slate-500 truncate max-w-[200px]">{doc.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                          {(doc.category || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 font-mono text-xs font-medium">{formatSize(doc.fileSize)}</td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full font-mono ${STATUS_STYLES[doc.status] || 'bg-slate-500/15 text-slate-400 border border-slate-500/30'}`}>
                          {doc.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full font-mono ${EMBEDDING_STYLES[doc.embeddingStatus] || 'bg-slate-500/15 text-slate-400 border border-slate-500/30'}`}>
                          {doc.embeddingStatus === 'COMPLETED' ? '✓ Indexed' :
                           doc.embeddingStatus === 'PROCESSING' ? '⟳ Indexing' :
                           doc.embeddingStatus === 'FAILED' ? '✗ Failed' : '○ Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 font-mono text-xs">{doc.chunkCount ?? 0}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openDetail(doc)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={actionLoading === doc.id}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          {isAdmin && doc.embeddingStatus !== 'COMPLETED' && doc.status !== 'DELETED' && (
                            <button
                              onClick={() => handleIndexOne(doc)}
                              disabled={actionLoading === doc.id || isIndexing}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Index this document"
                            >
                              <Brain size={16} />
                            </button>
                          )}
                          {isAdmin && doc.status !== 'DELETED' && (
                            <button
                              onClick={() => handleDelete(doc)}
                              disabled={actionLoading === doc.id}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          {isAdmin && doc.status === 'DELETED' && (
                            <button
                              onClick={() => handleRestore(doc)}
                              disabled={actionLoading === doc.id}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Restore"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/[0.08] bg-[#1E293B]/40 flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium font-mono">
              Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-3 py-1 border border-white/[0.12] rounded-lg text-slate-300 font-medium disabled:opacity-40 hover:bg-white/[0.06] transition-colors bg-[#1E293B]"
              >Previous</button>
              <span className="px-3 py-1 text-slate-400 font-medium font-mono">{pagination.page} / {pagination.totalPages}</span>
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-3 py-1 border border-white/[0.12] rounded-lg text-slate-300 font-medium disabled:opacity-40 hover:bg-white/[0.06] transition-colors bg-[#1E293B]"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => { setIsUploadModalOpen(false); fetchDocuments(); if (isAdmin) fetchStats(); }}
      />
      <DocumentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};

export default DocumentManagementPage;
