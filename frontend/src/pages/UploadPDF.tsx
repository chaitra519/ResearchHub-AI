import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { Workspace, Document } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  FileUp, 
  CheckCircle, 
  Download, 
  Info, 
  Loader2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const UploadPDF: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | ''>('');
  
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<Document | null>(null);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const resp = await api.get('/workspaces');
        setWorkspaces(resp.data);
        
        // If workspace ID was passed from another page in state (e.g. WorkspaceDetails), default to it
        const stateWorkspaceId = (location.state as any)?.workspaceId;
        if (stateWorkspaceId) {
          setSelectedWorkspaceId(stateWorkspaceId);
        } else if (resp.data.length > 0) {
          setSelectedWorkspaceId(resp.data[0].id);
        }
      } catch (err) {
        console.error("Failed to load workspaces", err);
      }
    };
    loadWorkspaces();
  }, [location]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    setUploadedDoc(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.name.toLowerCase().endsWith(".pdf")) {
        setFile(droppedFile);
      } else {
        setError("Only PDF documents are supported.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setUploadedDoc(null);
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file || !selectedWorkspaceId) return;

    setUploading(true);
    setError(null);
    setUploadedDoc(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspace_id", selectedWorkspaceId.toString());

    try {
      const resp = await api.post('/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadedDoc(resp.data);
      setFile(null); // Clear input file on success
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to process and index PDF. Ensure your Groq keys and databases are active.");
    } finally {
      setUploading(false);
    }
  };

  const downloadTextFile = (content: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold font-outfit text-white">Upload Research PDF</h2>
        <p className="text-sm text-gray-450 mt-1">
          Extract text using PyMuPDF, index it in vector collections, and generate immediate summary profiles.
        </p>
      </div>

      {/* Target workspace selector */}
      <div className="glass-panel p-6 rounded-2xl bg-violet-950/15 max-w-md">
        <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Import Target Workspace</label>
        {workspaces.length === 0 ? (
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-500/15 transition-all"
          >
            <span>Create a workspace first</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <select
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-violet-950/30 border border-violet-900/40 rounded-xl outline-none text-gray-200 text-sm font-semibold focus:border-violet-500/80 transition-all cursor-pointer"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id} className="bg-[#0E0A22]">
                {ws.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Upload Drag/Drop Box */}
      <div className="grid grid-cols-1 gap-6">
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`glass-panel p-12 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 relative ${
            dragActive 
              ? 'border-violet-400 bg-violet-950/35 scale-[1.01]' 
              : 'border-violet-900/40 hover:border-violet-750 hover:bg-violet-950/10'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-violet-950/45 text-violet-400">
              <FileUp className="w-8 h-8" />
            </div>
            {file ? (
              <div className="space-y-1">
                <p className="text-md font-semibold text-gray-200">{file.name}</p>
                <p className="text-xs text-gray-400 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-200">Drag & drop your research PDF here</p>
                <p className="text-xs text-gray-400">or click to browse local files (PDF only)</p>
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedWorkspaceId}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-purpleGlow"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Extracting & Indexing PDF...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload & Synthesize Document</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>

      {/* Error Output */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <Info className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results output */}
      <AnimatePresence>
        {uploadedDoc && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-4"
          >
            {/* Success message */}
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">PDF Processed Successfully!</p>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  Text extracted, executive summary generated, and document vector embeddings cached.
                </p>
              </div>
            </div>

            {/* Split panel: Left summary, Right extracted preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Summary card */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold font-outfit text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <span>Executive Summary</span>
                  </h3>
                  <div className="text-sm text-gray-300 font-light leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto pr-2">
                    {uploadedDoc.summary || 'Summary could not be generated.'}
                  </div>
                </div>
                {uploadedDoc.summary && (
                  <button
                    onClick={() => downloadTextFile(uploadedDoc.summary || '', `${uploadedDoc.filename}_summary.txt`)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-950/30 hover:bg-violet-950/50 border border-violet-900/30 text-violet-300 font-semibold rounded-xl text-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Summary</span>
                  </button>
                )}
              </div>

              {/* Extracted preview card */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold font-outfit text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-violet-400" />
                    <span>Extracted Text Preview</span>
                  </h3>
                  <div className="text-xs text-gray-400 font-mono p-4 rounded-xl bg-violet-950/25 border border-violet-950/40 max-h-96 overflow-y-auto pr-2 leading-relaxed">
                    {uploadedDoc.content.substring(0, 3000)}
                    {uploadedDoc.content.length > 3000 && "\n\n...[Truncated - Download full text below]..."}
                  </div>
                </div>
                <button
                  onClick={() => downloadTextFile(uploadedDoc.content, `${uploadedDoc.filename}_extracted_text.txt`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-950/30 hover:bg-violet-950/50 border border-violet-900/30 text-violet-300 font-semibold rounded-xl text-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Extracted Text</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default UploadPDF;
