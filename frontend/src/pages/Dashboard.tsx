import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { Workspace, Paper } from '../types';
import { 
  FolderPlus, 
  Trash2, 
  FileText, 
  ChevronRight, 
  Plus, 
  BookOpen, 
  FolderClosed, 
  Sparkles,
  Info
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [papersCount, setPapersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const wsResponse = await api.get('/workspaces');
      const wsList: Workspace[] = wsResponse.data;
      setWorkspaces(wsList);

      // Gather paper counts across workspaces
      let count = 0;
      for (const ws of wsList) {
        try {
          const papersResp = await api.get(`/workspaces/${ws.id}/papers`);
          count += papersResp.data.length;
        } catch (e) {
          // ignore
        }
      }
      setPapersCount(count);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspace.name.trim()) {
      setModalError("Workspace name is required");
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      const resp = await api.post('/workspaces', newWorkspace);
      setWorkspaces([...workspaces, resp.data]);
      setNewWorkspace({ name: '', description: '' });
      setModalOpen(false);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || "Failed to create workspace");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid navigating into workspace details
    if (!confirm("Are you sure you want to delete this workspace and all associated papers, documents, and chat logs?")) {
      return;
    }

    try {
      await api.delete(`/workspaces/${id}`);
      setWorkspaces(workspaces.filter(w => w.id !== id));
      // Refresh count
      fetchData();
    } catch (err) {
      alert("Failed to delete workspace");
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center gap-4">
        <span className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-mono tracking-widest uppercase">Syncing academic repository...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upper Dashboard Brief */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-outfit text-white">Your Workspace Hub</h2>
          <p className="text-sm text-gray-450 mt-1">Manage isolated research fields, papers, and AI chat sessions.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-purpleGlow transition-all duration-300 hover:scale-105"
        >
          <FolderPlus className="w-5 h-5" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 rounded-xl bg-violet-950/40 text-violet-400">
            <FolderClosed className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold font-outfit text-white">{workspaces.length}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-mono">Workspaces</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 rounded-xl bg-cyan-950/40 text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold font-outfit text-white">{papersCount}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-mono">Indexed Papers</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 sm:col-span-2 md:col-span-1">
          <div className="p-4 rounded-xl bg-emerald-950/40 text-emerald-400">
            <Sparkles className="w-6 h-6 animate-pulse-glow rounded" />
          </div>
          <div>
            <p className="text-md font-semibold font-outfit text-white">Agent Enabled</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-mono">Llama-3.3-70B Copilot</p>
          </div>
        </div>
      </div>

      {/* Workspaces List Grid */}
      {workspaces.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl space-y-4 max-w-xl mx-auto mt-8">
          <div className="inline-flex p-4 rounded-full bg-violet-950/40 text-violet-400">
            <FolderClosed className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-200">No workspaces yet</h3>
          <p className="text-sm text-gray-400 leading-relaxed font-light">
            Workspaces organize papers and separate AI chat memory. Start by creating a workspace for a specific topic or field of study.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl shadow-md transition-all duration-300"
          >
            Create Your First Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws, index) => (
            <motion.div
              key={ws.id}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              onClick={() => navigate(`/workspaces/${ws.id}`)}
              className="glass-panel glass-panel-hover p-6 rounded-2xl cursor-pointer flex flex-col justify-between h-48 relative overflow-hidden group"
            >
              {/* Card top details */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold font-outfit text-gray-100 group-hover:text-violet-300 transition-colors duration-300 truncate pr-6">
                    {ws.name}
                  </h3>
                  <button
                    onClick={(e) => handleDeleteWorkspace(ws.id, e)}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 absolute top-4 right-4 opacity-0 group-hover:opacity-100"
                    title="Delete workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-400 line-clamp-3 font-light leading-relaxed">
                  {ws.description || 'No description provided.'}
                </p>
              </div>

              {/* Card Bottom action */}
              <div className="flex items-center justify-between text-xs text-violet-400/80 font-semibold pt-4 border-t border-violet-950/20">
                <span>View Workspace Corpus</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Workspace Modal Overlay */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg glass-panel p-8 rounded-3xl z-10 space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-violet-900/30">
                <h3 className="text-2xl font-bold font-outfit text-white">Create New Workspace</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-405 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateWorkspace} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">Workspace Name</label>
                  <input
                    type="text"
                    value={newWorkspace.name}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                    placeholder="e.g. AI Interpretability, Quantum Computing"
                    className="w-full px-4 py-3 bg-violet-950/20 border border-violet-900/30 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-gray-200 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">Description (Optional)</label>
                  <textarea
                    value={newWorkspace.description}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                    placeholder="Briefly describe the domain focus or topic of study."
                    rows={4}
                    className="w-full px-4 py-3 bg-violet-950/20 border border-violet-900/30 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-gray-200 text-sm transition-all resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-3 bg-violet-950/30 hover:bg-violet-950/50 border border-violet-900/40 text-violet-300 font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-purpleGlow transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Workspace'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Dashboard;
