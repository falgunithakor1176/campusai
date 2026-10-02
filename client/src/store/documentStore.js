import { create } from 'zustand';
import api from '../services/api';

const useDocumentStore = create((set, get) => ({
  // State
  documents: [],          // Always an array
  selectedDocument: null,
  stats: null,
  indexingStatus: null,   // Phase 6B.2A: verification report
  isLoading: false,
  isUploading: false,
  isIndexing: false,
  error: null,

  filters: {
    page: 1,
    limit: 10,
    category: '',
    status: '',
    search: '',
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },

  // ─── Actions ──────────────────────────────────────────────────────────────

  setFilters: (newFilters) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...newFilters,
        page: newFilters.page !== undefined ? newFilters.page : 1,
      },
    }));
    get().fetchDocuments();
  },

  clearFilters: () => {
    set({ filters: { page: 1, limit: 10, category: '', status: '', search: '' } });
    get().fetchDocuments();
  },

  setSelectedDocument: (doc) => set({ selectedDocument: doc }),

  // ─── Phase 6B.2A — Indexing Actions ──────────────────────────────────────

  fetchIndexingStatus: async () => {
    try {
      const response = await api.get('/documents/index/status');
      set({ indexingStatus: response.data.data || null });
    } catch (error) {
      console.warn('Could not fetch indexing status:', error?.response?.status);
    }
  },

  indexDocument: async (id, force = false) => {
    set({ isIndexing: true });
    try {
      const response = await api.post(`/documents/${id}/index?force=${force}`);
      await get().fetchIndexingStatus();
      await get().fetchStats();
      await get().fetchDocuments();
      return response.data.data;
    } finally {
      set({ isIndexing: false });
    }
  },

  indexAll: async (force = false) => {
    set({ isIndexing: true });
    try {
      const response = await api.post(`/documents/index-all?force=${force}`);
      await get().fetchIndexingStatus();
      await get().fetchStats();
      await get().fetchDocuments();
      return response.data.data;
    } finally {
      set({ isIndexing: false });
    }
  },

  retryFailed: async () => {
    set({ isIndexing: true });
    try {
      const response = await api.post('/documents/index/retry-failed');
      await get().fetchIndexingStatus();
      await get().fetchStats();
      return response.data.data;
    } finally {
      set({ isIndexing: false });
    }
  },

  // ─── Fetch Documents ──────────────────────────────────────────────────────

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });

      const response = await api.get(`/documents?${params.toString()}`);
      const resData = response.data;

      // ApiResponse.paginated returns: { success, message, data: [...], pagination: {...} }
      set({
        documents: Array.isArray(resData.data) ? resData.data : [],
        pagination: resData.pagination || {
          total: 0, page: 1, limit: 10, totalPages: 1,
          hasNextPage: false, hasPrevPage: false,
        },
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, documents: [], error: error?.response?.data?.message || error.message });
      console.error('Failed to fetch documents:', error);
    }
  },

  // ─── Fetch Stats ──────────────────────────────────────────────────────────

  fetchStats: async () => {
    try {
      const response = await api.get('/documents/stats');
      // ApiResponse.success returns: { success, message, data: {...} }
      set({ stats: response.data.data || null });
    } catch (error) {
      // Stats failure is non-critical — don't crash the page
      console.warn('Failed to fetch document stats (may be a permissions issue):', error?.response?.status);
      set({ stats: null });
    }
  },

  // ─── Upload Document ──────────────────────────────────────────────────────

  uploadDocument: async (formData) => {
    set({ isUploading: true, error: null });
    try {
      // Route is POST /documents (not /documents/upload)
      const response = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newDoc = response.data.data;
      set((state) => ({
        documents: [newDoc, ...state.documents],
        isUploading: false,
      }));
      // Refresh stats after upload
      get().fetchStats();
      return newDoc;
    } catch (error) {
      set({ isUploading: false });
      throw error;
    }
  },

  // ─── Replace Document (PUT /:id) ──────────────────────────────────────────

  replaceDocument: async (id, formData) => {
    set({ isUploading: true, error: null });
    try {
      const response = await api.put(`/documents/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = response.data.data;
      set((state) => ({
        documents: state.documents.map((doc) => (doc.id === id ? updated : doc)),
        selectedDocument: updated,
        isUploading: false,
      }));
      return updated;
    } catch (error) {
      set({ isUploading: false });
      throw error;
    }
  },

  // ─── Delete Document ──────────────────────────────────────────────────────

  deleteDocument: async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id ? { ...doc, status: 'DELETED' } : doc
        ),
      }));
      get().fetchStats();
    } catch (error) {
      throw error;
    }
  },

  // ─── Restore Document ─────────────────────────────────────────────────────

  restoreDocument: async (id) => {
    try {
      // Route is POST /:id/restore
      const response = await api.post(`/documents/${id}/restore`);
      const restored = response.data.data;
      set((state) => ({
        documents: state.documents.map((doc) => (doc.id === id ? restored : doc)),
      }));
      get().fetchStats();
      return restored;
    } catch (error) {
      throw error;
    }
  },

  // ─── Download Document ────────────────────────────────────────────────────

  downloadDocument: async (id, filename) => {
    try {
      const response = await api.get(`/documents/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `document-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download document:', error);
      throw error;
    }
  },

  // ─── Fetch Versions ───────────────────────────────────────────────────────

  fetchVersions: async (id) => {
    try {
      const response = await api.get(`/documents/${id}/versions`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      return [];
    }
  },

  // ─── Fetch Audit Logs ─────────────────────────────────────────────────────

  fetchAuditLogs: async (id) => {
    try {
      const response = await api.get(`/documents/${id}/audit`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  },
}));

export default useDocumentStore;
