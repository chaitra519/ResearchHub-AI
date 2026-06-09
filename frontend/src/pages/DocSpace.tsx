import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Workspace, Document } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Save, 
  Download, 
  Trash2, 
  ArrowRight,
  Info,
  Loader2,
  CheckCircle,
  FileSignature
} from 'lucide-react';

export const DocSpace: React.FC = () => {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | ''>('');
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Editor states
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoading(true);
        const resp = await api.get('/workspaces');
        setWorkspaces(resp.data);
        if (resp.data.length > 0) {
          setSelectedWorkspaceId(resp.data[0].id);
        }
      } catch (err) {
        console.error("Failed to load workspaces", err);
      } finally {
        setLoading(false);
      }
    };
    loadWorkspaces();
  }, []);

  // Fetch documents when selected workspace changes
  useEffect(() => {
    const loadDocuments = async () => {
      if (!selectedWorkspaceId) {
        setDocuments([]);
        setSelectedDoc(null);
        return;
      }
      try {
        const resp = await api.get(`/workspaces/${selectedWorkspaceId}/documents`);
        // Filter out system uploaded pdf files if desired, or show all.
        // PDF files usually store their original PDF content. Let's show all documents so users can edit anything.
        setDocuments(resp.data);
        if (resp.data.length > 0) {
          handleSelectDoc(resp.data[0]);
        } else {
          handleNewDoc();
        }
      } catch (err) {
        console.error("Failed to load documents", err);
      }
    };
    loadDocuments();
  }, [selectedWorkspaceId]);

  const handleSelectDoc = (doc: Document) => {
    setSelectedDoc(doc);
    setFilename(doc.filename);
    setContent(doc.content);
  };

  const handleNewDoc = () => {
    setSelectedDoc(null);
    setFilename('Untitled_Draft.md');
    setContent('');
  };

  const handleSave = async () => {
    if (!selectedWorkspaceId) return;
    if (!filename.trim()) {
      alert("Document filename is required!");
      return;
    }

    setSaving(true);
    setToastMessage(null);

    try {
      if (selectedDoc) {
        // Update existing
        const resp = await api.put(`/documents/${selectedDoc.id}`, {
          workspace_id: selectedWorkspaceId,
          filename,
          content
        });
        setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? resp.data : d));
        setSelectedDoc(resp.data);
      } else {
        // Create new
        const resp = await api.post(`/workspaces/${selectedWorkspaceId}/documents`, {
          workspace_id: selectedWorkspaceId,
          filename,
          content
        });
        setDocuments(prev => [...prev, resp.data]);
        setSelectedDoc(resp.data);
      }
      
      setToastMessage("Document saved & vector indexed!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert("Failed to save document. Check backend logs.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    setDeletingId(id);
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (selectedDoc && selectedDoc.id === id) {
        handleNewDoc();
      }
    } catch (err) {
      alert("Failed to delete document.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = () => {
    if (!content.trim()) return;
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center gap-4">
        <span className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-mono tracking-widest uppercase">Opening note space...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[82vh] flex flex-col">
      {/* Page Header */}
      <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-outfit text-white">Doc Space</h2>
          <p className="text-sm text-gray-450 mt-1">
            Write academic notes, compile outlines, or refine literature reviews. Content is synced dynamically.
          </p>
        </div>

        {/* Workspace select */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider whitespace-nowrap">Active Workspace:</span>
          {workspaces.length === 0 ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold"
            >
              <span>Create Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(parseInt(e.target.value))}
              className="px-4 py-2 bg-violet-950/30 border border-violet-900/40 rounded-xl outline-none text-gray-200 text-xs font-semibold focus:border-violet-500/80 cursor-pointer"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id} className="bg-[#0E0A22]">
                  {ws.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Split Space: Left list, Right editor */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
        {/* Left note selector */}
        <div className="w-full md:w-64 flex-shrink-0 glass-panel rounded-2xl flex flex-col overflow-hidden max-h-48 md:max-h-none">
          <div className="p-4 border-b border-violet-900/30 bg-violet-950/15 flex justify-between items-center">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Saved Notes</span>
            <button
              onClick={handleNewDoc}
              className="p-1 rounded-lg bg-violet-900/40 hover:bg-violet-900/60 text-violet-300 transition-colors"
              title="New Document"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 flex md:block flex-row md:space-x-0 space-x-2">
            {documents.length === 0 ? (
              <p className="text-xs text-gray-500 p-4 text-center">No documents.</p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 flex-shrink-0 md:w-auto w-48 ${
                    selectedDoc?.id === doc.id
                      ? 'bg-violet-900/35 border-l-4 border-violet-500 text-violet-300 font-semibold'
                      : 'text-gray-400 hover:bg-violet-950/10 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 flex-shrink-0 text-violet-400/80" />
                    <span className="text-xs truncate">{doc.filename}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    disabled={deletingId === doc.id}
                    className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 md:block hidden"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right rich editor */}
        <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden bg-violet-950/5">
          {/* Editor Header actions */}
          <div className="p-4 border-b border-violet-900/30 bg-violet-950/15 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="document_name.md"
              className="bg-transparent border-b border-transparent focus:border-violet-500 outline-none text-gray-200 text-sm font-semibold py-1 px-1 transition-all sm:w-80 w-full"
            />

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={handleDownload}
                disabled={!content.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-950/30 hover:bg-violet-950/50 border border-violet-900/40 text-violet-300 text-xs font-mono rounded-lg transition-all disabled:opacity-40"
              >
                <Download className="w-4 h-4" />
                <span>Export (.md)</span>
              </button>

              <button
                onClick={handleSave}
                disabled={saving || workspaces.length === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-semibold rounded-lg shadow-purpleGlow transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-400 text-xs font-mono"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text Editor Area */}
          <div className="flex-1 relative p-1 bg-violet-950/10">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Literature Review Draft&#10;&#10;## Introduction&#10;Write your academic reviews or summary notes here. Supports standard Markdown syntax..."
              className="w-full h-full p-6 bg-transparent outline-none border-none text-gray-200 font-mono text-sm resize-none leading-relaxed placeholder:text-gray-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default DocSpace;
