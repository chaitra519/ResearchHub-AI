import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { Workspace, Paper, Conversation } from '../types';
import { 
  BookOpen, 
  MessageSquare, 
  FileSignature, 
  Send, 
  Plus, 
  Download, 
  FileText, 
  User, 
  Atom, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export const WorkspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'papers' | 'chat' | 'review'>('papers');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [chatHistory, setChatHistory] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Paper details modal
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  // Chat input
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Review states
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchWorkspaceData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const wsResp = await api.get(`/workspaces`);
      const currentWs = wsResp.data.find((w: Workspace) => w.id === parseInt(id));
      if (!currentWs) {
        navigate('/dashboard');
        return;
      }
      setWorkspace(currentWs);

      // Fetch papers
      const papersResp = await api.get(`/workspaces/${id}/papers`);
      setPapers(papersResp.data);

      // Fetch chat history
      const chatResp = await api.get(`/workspaces/${id}/chat`);
      setChatHistory(chatResp.data);
    } catch (err) {
      console.error("Failed to load workspace data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
    // Reset review result when workspace changes
    setReviewResult(null);
  }, [id]);

  useEffect(() => {
    // Scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeTab]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !id || chatLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatLoading(true);

    // Optimistically add user message to chat history list
    const tempMessage: Conversation = {
      id: Date.now(),
      workspace_id: parseInt(id),
      question: userMessage,
      answer: "Thinking...",
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, tempMessage]);

    try {
      const resp = await api.post('/chat', {
        workspace_id: parseInt(id),
        question: userMessage
      });
      
      // Update with server answer
      setChatHistory(prev => 
        prev.map(c => c.id === tempMessage.id ? { ...c, answer: resp.data.answer } : c)
      );
    } catch (err) {
      setChatHistory(prev => 
        prev.map(c => c.id === tempMessage.id ? { ...c, answer: "❌ Failed to generate response. Ensure GROQ_API_KEY is configured." } : c)
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateReview = async () => {
    if (!id || papers.length === 0) {
      setReviewError("You need at least one paper in the workspace to generate a review.");
      return;
    }
    setReviewLoading(true);
    setReviewError(null);
    setReviewResult(null);

    try {
      const resp = await api.post('/generate-review', {
        workspace_id: parseInt(id)
      });
      setReviewResult(resp.data.result);
    } catch (err: any) {
      setReviewError(err.response?.data?.detail || "Failed to generate literature review. Make sure GROQ_API_KEY is set.");
    } finally {
      setReviewLoading(false);
    }
  };

  const downloadMarkdownFile = (content: string, filename: string) => {
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
        <p className="text-sm text-gray-400 font-mono tracking-widest uppercase">Loading workspace corpus...</p>
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="space-y-6 flex flex-col h-[85vh]">
      {/* Workspace Header */}
      <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-violet-900/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-violet-900/40 text-violet-300">WORKSPACE</span>
            <span className="text-xs text-gray-400 font-mono">{papers.length} Papers</span>
          </div>
          <h2 className="text-3xl font-extrabold font-outfit text-white mt-1">{workspace.name}</h2>
          <p className="text-sm text-gray-400 font-light mt-1">{workspace.description || 'No description.'}</p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-violet-950/25 border border-violet-900/30 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('papers')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'papers' ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Papers</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'chat' ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'review' ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            <span>Generate Review</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* TAB 1: PAPERS LIST */}
          {activeTab === 'papers' && (
            <motion.div
              key="papers"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 h-full"
            >
              {papers.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl max-w-xl mx-auto mt-12 space-y-4">
                  <div className="p-4 rounded-full bg-violet-950/40 text-violet-400 inline-flex">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-200">No papers imported</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-light">
                    This workspace does not have any research papers. You can search external archives (ArXiv) or upload PDF documents.
                  </p>
                  <div className="flex justify-center gap-4 pt-2">
                    <button
                      onClick={() => navigate('/search')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Search & Import</span>
                    </button>
                    <button
                      onClick={() => navigate('/upload', { state: { workspaceId: workspace.id } })}
                      className="flex items-center gap-2 px-5 py-2.5 bg-violet-950/40 hover:bg-violet-950/60 border border-violet-900/30 text-violet-300 font-semibold rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload PDF</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                  {papers.map((paper) => (
                    <div
                      key={paper.id}
                      onClick={() => setSelectedPaper(paper)}
                      className="glass-panel glass-panel-hover p-6 rounded-2xl cursor-pointer flex flex-col justify-between group h-64"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-mono uppercase text-violet-400 bg-violet-950/20 px-2 py-0.5 rounded">
                            {paper.source || 'Imported'}
                          </span>
                          {paper.pdf_url && (
                            <a
                              href={paper.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-400 hover:text-violet-400 transition-colors"
                              title="Download PDF link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <h4 className="text-lg font-bold font-outfit text-gray-100 group-hover:text-violet-300 line-clamp-2 transition-colors">
                          {paper.title}
                        </h4>
                        <p className="text-xs text-violet-300/80 truncate">
                          👤 {paper.authors || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-400 line-clamp-3 font-light leading-relaxed">
                          {paper.abstract}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-violet-400 pt-3 border-t border-violet-950/25 mt-4">
                        <span>Read Full Abstract</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: AI AGENT CHAT */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col h-full bg-[#0E0A22]/35 border border-violet-900/20 rounded-2xl overflow-hidden"
            >
              {/* Message scroll list */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {chatHistory.length === 0 ? (
                  <div className="text-center max-w-md mx-auto pt-16 space-y-4">
                    <div className="p-3 bg-gradient-to-tr from-violet-600 to-cyan-500 text-white rounded-2xl shadow-purpleGlow inline-flex animate-bounce">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-200">Consult your ResearchAssistant</h4>
                    <p className="text-sm text-gray-400 leading-relaxed font-light">
                      Ask questions about methodologies, models, theoretical bounds, or findings. The assistant will reference papers imported in this workspace.
                    </p>
                  </div>
                ) : (
                  chatHistory.map((chat) => (
                    <div key={chat.id} className="space-y-4">
                      {/* User Bubble */}
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-violet-600/90 to-purple-600/90 text-white px-5 py-3.5 rounded-2xl max-w-xl text-sm shadow-md">
                          <p className="leading-relaxed">{chat.question}</p>
                        </div>
                      </div>

                      {/* Assistant Bubble */}
                      <div className="flex justify-start items-start gap-3">
                        <div className="p-2.5 bg-violet-950/40 border border-violet-850/45 text-violet-400 rounded-xl flex-shrink-0">
                          <Atom className="w-5 h-5" />
                        </div>
                        <div className="bg-[#120C28]/95 border border-violet-900/30 text-gray-200 px-5 py-3.5 rounded-2xl max-w-2xl text-sm leading-relaxed prose prose-invert">
                          {chat.answer === "Thinking..." ? (
                            <div className="flex items-center gap-2 text-violet-400/80 font-mono text-xs">
                              <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" />
                              <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-100" />
                              <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-200" />
                              <span>Searching vector indices...</span>
                            </div>
                          ) : (
                            <p className="whitespace-pre-line">{chat.answer}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-violet-900/30 bg-[#0A0718]/60 flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    papers.length > 0
                      ? "Ask a question about the workspace research corpus..."
                      : "Import papers to query workspace details..."
                  }
                  disabled={papers.length === 0 || chatLoading}
                  className="flex-1 px-4 py-3 bg-violet-950/20 border border-violet-900/30 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-gray-200 text-sm transition-all disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={papers.length === 0 || !chatInput.trim() || chatLoading}
                  className="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-md transition-all duration-300 disabled:opacity-40 flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          )}

          {/* TAB 3: GENERATE LITERATURE REVIEW */}
          {activeTab === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 pb-8 max-w-4xl mx-auto h-full"
            >
              <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="text-xl font-bold font-outfit text-white">Synthesize Literature Review</h4>
                  <p className="text-sm text-gray-400 font-light mt-0.5">
                    Cohesively synthesize imported papers, contrast methodologies, and extract gaps.
                  </p>
                </div>
                <button
                  onClick={handleGenerateReview}
                  disabled={reviewLoading}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-purpleGlow transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                >
                  {reviewLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Compiling Review...</span>
                    </>
                  ) : (
                    <>
                      <Atom className="w-4 h-4 animate-spin-slow" />
                      <span>Synthesize Corpus</span>
                    </>
                  )}
                </button>
              </div>

              {reviewError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  <span>{reviewError}</span>
                </div>
              )}

              {reviewLoading && (
                <div className="glass-panel p-16 text-center rounded-2xl space-y-4 animate-pulse">
                  <span className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin inline-block" />
                  <h4 className="text-lg font-bold text-gray-200">Generating Synthetic Review</h4>
                  <p className="text-sm text-gray-400 font-light max-w-sm mx-auto">
                    The ResearchAssistant is querying database records, parsing abstracts, comparing frameworks, and drafting structured literature content...
                  </p>
                </div>
              )}

              {reviewResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex justify-end">
                    <button
                      onClick={() => downloadMarkdownFile(reviewResult, `${workspace.name.replace(/\s+/g, '_')}_literature_review.md`)}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-950/30 hover:bg-violet-950/50 border border-violet-900/30 text-violet-300 text-xs font-mono rounded-lg transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Markdown (.md)</span>
                    </button>
                  </div>
                  <div className="glass-panel p-8 rounded-2xl bg-[#120B28]/60 text-gray-200 text-sm leading-relaxed prose prose-invert max-w-none shadow-glass overflow-x-auto">
                    <p className="whitespace-pre-line font-light">{reviewResult}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Paper Details Modal Overlay */}
      <AnimatePresence>
        {selectedPaper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPaper(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-2xl glass-panel p-8 rounded-3xl z-10 space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start pb-4 border-b border-violet-900/30">
                <div>
                  <span className="text-xs font-mono uppercase text-violet-400 bg-violet-950/20 px-2 py-0.5 rounded">
                    {selectedPaper.source || 'arXiv'}
                  </span>
                  <h3 className="text-2xl font-bold font-outfit text-white mt-1 pr-6">{selectedPaper.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedPaper(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-xs font-mono text-gray-450 uppercase tracking-widest">Authors</h5>
                  <p className="text-sm font-semibold text-violet-300 mt-1">{selectedPaper.authors || 'Unknown'}</p>
                </div>

                <div>
                  <h5 className="text-xs font-mono text-gray-455 uppercase tracking-widest">Abstract</h5>
                  <p className="text-sm text-gray-300 font-light leading-relaxed whitespace-pre-line mt-2 bg-violet-950/15 p-4 rounded-xl border border-violet-950/20">
                    {selectedPaper.abstract}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-violet-900/30">
                {selectedPaper.pdf_url && (
                  <a
                    href={selectedPaper.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl text-center shadow-purpleGlow transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Paper</span>
                  </a>
                )}
                <button
                  onClick={() => setSelectedPaper(null)}
                  className="flex-1 py-3 bg-violet-950/30 hover:bg-violet-950/50 border border-violet-900/40 text-violet-300 font-semibold rounded-xl transition-all"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default WorkspaceDetail;
