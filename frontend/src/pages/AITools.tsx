import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Workspace, Paper } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  FileText, 
  Cpu, 
  Download, 
  Loader2, 
  Info,
  BookOpen,
  ArrowRight,
  Atom
} from 'lucide-react';

export const AITools: React.FC = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | ''>('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<number | 'all' | ''>('all');
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load workspaces on mount
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

  // Fetch papers when selected workspace changes
  useEffect(() => {
    const loadPapers = async () => {
      if (!selectedWorkspaceId) {
        setPapers([]);
        return;
      }
      try {
        const resp = await api.get(`/workspaces/${selectedWorkspaceId}/papers`);
        setPapers(resp.data);
        setSelectedPaperId('all');
      } catch (err) {
        console.error("Failed to load papers", err);
      }
    };
    loadPapers();
    setResult(null);
    setError(null);
  }, [selectedWorkspaceId]);

  const handleRunTool = async (type: 'summary' | 'insights') => {
    if (!selectedWorkspaceId) return;

    setActionLoading(true);
    setError(null);
    setResult(null);

    const endpoint = type === 'summary' ? '/generate-summary' : '/extract-insights';
    const payload: { paper_id?: number; workspace_id?: number } = {};
    
    if (selectedPaperId === 'all') {
      payload.workspace_id = selectedWorkspaceId;
    } else {
      payload.paper_id = parseInt(selectedPaperId as string);
    }

    try {
      const resp = await api.post(endpoint, payload);
      setResult(resp.data.result);
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to generate ${type}. Ensure your API keys are configured.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    const fileName = selectedPaperId === 'all' 
      ? `workspace_${selectedWorkspaceId}_synthesis.md` 
      : `paper_${selectedPaperId}_details.md`;
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center gap-4">
        <span className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-mono tracking-widest uppercase">Initializing analytical tools...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold font-outfit text-white">AI Tools Space</h2>
        <p className="text-sm text-gray-450 mt-1">
          Perform executive summarization and key scientific insight extraction across your workspace papers.
        </p>
      </div>

      {/* Selectors Panel */}
      <div className="glass-panel p-6 rounded-2xl bg-violet-950/15 border border-violet-900/20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Select Workspace</label>
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

        <div>
          <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Select Paper Focus</label>
          <select
            value={selectedPaperId}
            onChange={(e) => setSelectedPaperId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            disabled={papers.length === 0}
            className="w-full px-4 py-3 bg-violet-950/30 border border-violet-900/40 rounded-xl outline-none text-gray-200 text-sm font-semibold focus:border-violet-500/80 transition-all cursor-pointer disabled:opacity-40"
          >
            <option value="all" className="bg-[#0E0A22]">
              All Papers in Workspace ({papers.length})
            </option>
            {papers.map((paper) => (
              <option key={paper.id} value={paper.id} className="bg-[#0E0A22]">
                {paper.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warning if no papers */}
      {selectedWorkspaceId && papers.length === 0 && (
        <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-900/40 text-violet-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            <span>This workspace has no papers. Import research papers to unlock AI tools.</span>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-all"
          >
            <BookOpen className="w-4.5 h-4.5" />
            <span>Search papers</span>
          </button>
        </div>
      )}

      {/* Action triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-48 hover:border-violet-900/30 transition-all">
          <div className="space-y-2">
            <div className="p-2.5 bg-violet-950/40 text-violet-400 rounded-xl inline-flex">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-outfit text-gray-100">Executive Summary</h3>
            <p className="text-xs text-gray-400 font-light leading-relaxed">
              Generate structured academic summaries covering primary objectives, methodology, and scientific contributions.
            </p>
          </div>
          <button
            onClick={() => handleRunTool('summary')}
            disabled={actionLoading || papers.length === 0}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Generate Summary</span>
          </button>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-48 hover:border-violet-900/30 transition-all">
          <div className="space-y-2">
            <div className="p-2.5 bg-cyan-950/40 text-cyan-400 rounded-xl inline-flex">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-outfit text-gray-100">Insight Extractor</h3>
            <p className="text-xs text-gray-400 font-light leading-relaxed">
              Extract methodological innovations, core experimental proof metrics, and identified scientific bounds or gaps.
            </p>
          </div>
          <button
            onClick={() => handleRunTool('insights')}
            disabled={actionLoading || papers.length === 0}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Extract Insights</span>
          </button>
        </div>
      </div>

      {/* Error Output */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <Info className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Dynamic Results Display */}
      <AnimatePresence>
        {actionLoading && (
          <div className="glass-panel p-16 text-center rounded-2xl space-y-4 animate-pulse">
            <span className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin inline-block" />
            <h4 className="text-md font-bold text-gray-200">Executing Agentic Synthesis</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto font-light">
              Analyzing literature details, generating vectors, and structuring scientific responses using Llama 3.3...
            </p>
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-violet-900/20">
              <h3 className="text-xl font-bold font-outfit text-white flex items-center gap-2">
                <Atom className="w-5 h-5 text-violet-400 animate-spin-slow" />
                <span>AI Generated Analysis</span>
              </h3>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 bg-violet-950/30 hover:bg-violet-950/50 border border-violet-900/30 text-violet-300 text-xs font-mono rounded-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Markdown (.md)</span>
              </button>
            </div>

            <div className="glass-panel p-8 rounded-2xl bg-[#120B28]/60 text-gray-250 text-sm leading-relaxed prose prose-invert overflow-x-auto">
              <p className="whitespace-pre-line font-light">{result}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AITools;
