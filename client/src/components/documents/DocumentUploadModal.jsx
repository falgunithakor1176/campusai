import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useDocumentStore from '../../store/documentStore';

const DocumentUploadModal = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    visibility: 'internal',
  });
  
  const fileInputRef = useRef(null);
  const uploadDocument = useDocumentStore((state) => state.uploadDocument);
  const isUploading = useDocumentStore((state) => state.isUploading);

  const categories = ['policy', 'procedure', 'form', 'manual', 'other'];
  const visibilities = ['public', 'internal', 'confidential'];

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: e.dataTransfer.files[0].name.split('.')[0] }));
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: e.target.files[0].name.split('.')[0] }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('visibility', formData.visibility);

    try {
      await uploadDocument(data);
      handleClose();
    } catch (error) {
      // Error handled by store
    }
  };

  const handleClose = () => {
    setFile(null);
    setFormData({ title: '', description: '', category: 'other', visibility: 'internal' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl overflow-hidden bg-[#111827] rounded-2xl border border-white/[0.12] shadow-2xl"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-[#1E293B]/40">
            <h3 className="text-xl font-semibold text-white font-heading">Upload Document</h3>
            <button
              onClick={handleClose}
              className="p-2 transition-colors rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08]"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-12 transition-all border-2 border-dashed rounded-xl border-white/[0.12] hover:border-indigo-500/60 hover:bg-indigo-500/10 cursor-pointer"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <UploadCloud size={48} className="mb-4 text-indigo-400" />
                <p className="mb-2 text-lg font-semibold text-white">Click or drag file to this area to upload</p>
                <p className="text-sm text-slate-400 text-center">Support for single or bulk upload. Select CADCE official handbooks or policy PDFs.</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-xl border-white/[0.08] bg-[#1E293B]/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{file.name}</p>
                    <p className="text-sm text-slate-400 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-2 transition-colors rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/15"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-300">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 text-white bg-[#0B1120]/80 border border-white/[0.12] rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  placeholder="Document Title"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 text-white bg-[#0B1120]/80 border border-white/[0.12] rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[80px] font-medium"
                  placeholder="Brief description of the document"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 text-white bg-[#0B1120]/80 border border-white/[0.12] rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-300">Visibility</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="w-full px-4 py-2 text-white bg-[#0B1120]/80 border border-white/[0.12] rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  >
                    {visibilities.map((vis) => (
                      <option key={vis} value={vis}>
                        {vis.charAt(0).toUpperCase() + vis.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 space-x-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-semibold transition-colors border rounded-lg border-white/[0.12] text-slate-300 hover:bg-white/[0.05]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || isUploading}
                className="flex items-center px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentUploadModal;
