import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Atom, 
  Search, 
  Sparkles, 
  Upload, 
  FileText, 
  ArrowRight,
  Database,
  ShieldCheck
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const features = [
    {
      title: "Agentic AI Assistant",
      desc: "Converse with our Llama-powered ResearchAssistant agent that retrieves details directly from your custom paper corpus.",
      icon: Sparkles,
      color: "from-purple-500 to-indigo-600"
    },
    {
      title: "PDF Text Extraction",
      desc: "Drag & drop PDF papers. We extract full texts using PyMuPDF and generate summary briefings immediately.",
      icon: Upload,
      color: "from-cyan-400 to-blue-600"
    },
    {
      title: "Semantic Vector Search",
      desc: "Query your workspace. Our sentence-transformers vector engine finds the most relevant excerpts across all your literature.",
      icon: Database,
      color: "from-emerald-400 to-teal-600"
    },
    {
      title: "Literature Review Synthesis",
      desc: "Automate drafts. Collate abstracts and notes to generate publication-grade structured reviews with critical gaps identified.",
      icon: Atom,
      color: "from-pink-500 to-rose-600"
    },
    {
      title: "Interactive Doc Space",
      desc: "Write and format notes or reviews in our Markdown-enabled environment. Save and download drafts on the fly.",
      icon: FileText,
      color: "from-amber-400 to-orange-600"
    },
    {
      title: "Global Literature Search",
      desc: "Search directly across academic repositories like ArXiv and import files into your workspace in a single click.",
      icon: Search,
      color: "from-violet-500 to-purple-600"
    }
  ];

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-center items-center">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center max-w-4xl mx-auto space-y-8 z-10"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-950/45 border border-violet-800/40 text-xs text-violet-300 tracking-wide font-mono shadow-purpleGlow">
          <Atom className="w-4 h-4 animate-spin-slow text-violet-400" />
          <span>MEET YOUR AGENTIC AI RESEARCH COPILOT</span>
        </motion.div>

        <motion.h1 
          variants={itemVariants} 
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-outfit tracking-tight leading-none"
        >
          Transform Academic Literature <br />
          <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent text-glow-purple">
            With Agentic AI Intelligence
          </span>
        </motion.h1>

        <motion.p 
          variants={itemVariants} 
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed"
        >
          ResearchHub AI combines local Vector Search (ChromaDB + sentence-transformers) 
          and advanced Reasoning (Llama 3.3 via Groq) to index, search, summarize, and draft literature syntheses.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-2xl shadow-purpleGlow transition-all duration-300 hover:scale-105"
          >
            <span>Go to Workspaces</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 px-8 py-4 bg-violet-950/30 hover:bg-violet-950/50 border border-violet-850/50 text-violet-300 font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
          >
            <Search className="w-5 h-5" />
            <span>Search Papers</span>
          </button>
        </motion.div>
      </motion.div>

      {/* Features Grid */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mt-24 z-10"
      >
        {features.map((feature, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-tr ${feature.color} text-white shadow-md`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-gray-100">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-light">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.section>

      {/* Security note footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        viewport={{ once: true }}
        className="flex items-center gap-2 mt-16 text-xs text-violet-400/60 font-mono tracking-widest uppercase border-t border-violet-950/40 pt-6 w-full justify-center"
      >
        <ShieldCheck className="w-4 h-4 text-violet-500" />
        <span>JWT Encrypted Sessions & Environment Isolation Active</span>
      </motion.div>
    </div>
  );
};
export default Home;
