import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Workspace, ArXivPaper } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  BookOpen, 
  FolderPlus, 
  ExternalLink, 
  ArrowRight,
  Info,
  CheckCircle,
  Loader2,
  Atom
} from 'lucide-react';

export const SearchPapers: React.FC = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | ''>('');
  
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState<ArXivPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks imported paper titles to prevent double-importing and show checkmarks
  const [importedTitles, setImportedTitles] = useState<string[]>([]);
  const [importingTitle, setImportingTitle] = useState<string | null>(null);

  useEffect(() => {
    // Load workspaces on mount to populate target dropdown
    const loadWorkspaces = async () => {
      try {
        const resp = await api.get('/workspaces');
        setWorkspaces(resp.data);
        if (resp.data.length > 0) {
          setSelectedWorkspaceId(resp.data[0].id);
        }
      } catch (err) {
        console.error("Failed to load workspaces", err);
      }
    };
    loadWorkspaces();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setPapers([]);
    try {
      const resp = await api.get('/search', { params: { query } });
      setPapers(resp.data);
      if (resp.data.length === 0) {
        setError("No papers found matching your query. Try different terms.");
      }
    } catch (err: any) {
      setError("An error occurred while searching. Using fallback archive papers instead.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (paper: ArXivPaper) => {
    if (!selectedWorkspaceId) {
      alert("Please select a target workspace first!");
      return;
    }

    setImportingTitle(paper.title);
    try {
      await api.post('/import-paper', {
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        source: paper.source || 'arXiv',
        pdf_url: paper.pdf_url,
        workspace_id: selectedWorkspaceId
      });
      setImportedTitles(prev => [...prev, paper.title]);
    } catch (err) {
      alert("Failed to import paper. Ensure backend connection is alive.");
    } finally {
      setImportingTitle(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold font-outfit text-white">Literature Search</h2>
        <p className="text-sm text-gray-450 mt-1">
          Query research papers instantly and import abstract data straight to your workspaces.
        </p>
      </div>

      {/* Workspace Selection & Search form */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-end bg-violet-950/15">
        <div className="w-full md:w-1/3">
          <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span>Target Workspace</span>
            <span className="text-[10px] text-violet-400 bg-violet-950/35 px-1.5 py-0.5 rounded font-sans">IMPORT DESTINATION</span>
          </label>
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
                <option key={ws.id} value={ws.id} className="bg-[#0E0A22] text-gray-200 font-sans">
                  {ws.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex-1 flex gap-3 w-full">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Deep learning alignment, RAG optimization, Transformer architectures..."
              className="w-full pl-11 pr-4 py-3 bg-violet-950/20 border border-violet-900/30 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-gray-200 text-sm transition-all placeholder:text-gray-650"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Error / Status notices */}
      {error && (
        <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-900/40 text-violet-400 text-sm flex items-center gap-3">
          <Info className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton Panel */}
      {loading && (
        <div className="space-y-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel p-6 rounded-2xl animate-pulse space-y-4">
              <div className="h-6 bg-violet-900/20 rounded w-3/4" />
              <div className="h-4 bg-violet-900/10 rounded w-1/4" />
              <div className="space-y-2">
                <div className="h-4 bg-violet-900/10 rounded w-full" />
                <div className="h-4 bg-violet-900/10 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search results list */}
      <div className="space-y-6">
        <AnimatePresence>
          {papers.map((paper, i) => {
            const isImported = importedTitles.includes(paper.title);
            const isImporting = importingTitle === paper.title;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="glass-panel p-6 rounded-2xl space-y-4 hover:border-violet-900/40 transition-colors"
              >
                {/* Paper header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-semibold uppercase text-violet-400 bg-violet-950/30 px-2 py-0.5 rounded">
                        {paper.source}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/20 px-2 py-0.5 rounded">
                        Published: {paper.year}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold font-outfit text-gray-100">{paper.title}</h3>
                    <p className="text-xs text-violet-300 font-semibold">{paper.authors}</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {paper.pdf_url && (
                      <a
                        href={paper.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-violet-950/20 hover:bg-violet-950/40 border border-violet-900/30 text-violet-300 rounded-xl transition-all"
                        title="Open PDF"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleImport(paper)}
                      disabled={isImported || isImporting || workspaces.length === 0}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md ${
                        isImported
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default'
                          : 'bg-violet-600 hover:bg-violet-500 text-white shadow-purpleGlow disabled:opacity-50'
                      }`}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Importing...</span>
                        </>
                      ) : isImported ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Imported</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4" />
                          <span>Import abstract</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Abstract Text */}
                <p className="text-sm text-gray-450 leading-relaxed font-light whitespace-pre-line border-t border-violet-950/20 pt-4">
                  {paper.abstract}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default SearchPapers;
