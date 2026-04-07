"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Shield, 
  Plus, 
  X, 
  Search, 
  Terminal, 
  Globe, 
  Server, 
  Bot, 
  AlertTriangle, 
  Play, 
  ChevronDown,
  Save,
  Key,
  Database,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Config {
  openai_api_keys: string[];
  anthropic_api_keys: string[];
  gemini_api_keys: string[];
  groq_api_keys: string[];
  vertexai_api_keys: string[];
  is_active: boolean;
  max_agents: number;
  target_theme: string;
  max_repo_age_days: number;
  scan_issues: boolean;
  finder_model: string;
  verifier_model: string;
  fixer_model: string;
  use_verifier: boolean;
  auto_fallback_random: boolean;
  local_base_url: string;
  github_token: string;
}

export default function Admin() {
  const [config, setConfig] = useState<Config>({
    openai_api_keys: [''],
    anthropic_api_keys: [''],
    gemini_api_keys: [''],
    groq_api_keys: [''],
    vertexai_api_keys: [''],
    is_active: true,
    max_agents: 4,
    target_theme: '',
    max_repo_age_days: 30,
    scan_issues: false,
    finder_model: 'gpt-4o-mini',
    verifier_model: 'gpt-4o-mini',
    fixer_model: 'gpt-4o',
    use_verifier: true,
    auto_fallback_random: false,
    local_base_url: 'http://localhost:11434/v1',
    github_token: ''
  });
  const [saving, setSaving] = useState(false);
  const [searchModel, setSearchModel] = useState('');
  const [modelDropdown, setModelDropdown] = useState<string | null>(null);

  const popularModels = [
    { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", desc: "Flagship intelligence, high cost" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", desc: "Fast, cheap, reliable" },
    { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet", provider: "Anthropic", desc: "Exceptional coding abilities" },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", provider: "Anthropic", desc: "Blazing fast inference" },
    { id: "gemini/gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google", desc: "Massive context window" },
    { id: "groq/llama3-70b-8192", name: "Llama 3 70B", provider: "Groq", desc: "Open weights, ultra low-latency" },
    { id: "local/llama3", name: "Local Llama 3", provider: "Local", desc: "Runs on your hardware" },
  ];

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/config`)
      .then(res => res.json())
      .then(data => {
        const safeArr = (val: unknown) => Array.isArray(val) && val.length > 0 ? val : [''];
        setConfig({
          openai_api_keys: safeArr(data.openai_api_keys),
          anthropic_api_keys: safeArr(data.anthropic_api_keys),
          gemini_api_keys: safeArr(data.gemini_api_keys),
          groq_api_keys: safeArr(data.groq_api_keys),
          vertexai_api_keys: safeArr(data.vertexai_api_keys),
          is_active: data.is_active ?? true,
          max_agents: data.max_agents ?? 4,
          target_theme: data.target_theme ?? '',
          max_repo_age_days: data.max_repo_age_days ?? 30,
          scan_issues: data.scan_issues ?? false,
          finder_model: data.finder_model ?? 'gpt-4o-mini',
          verifier_model: data.verifier_model ?? 'gpt-4o-mini',
          fixer_model: data.fixer_model ?? 'gpt-4o',
          use_verifier: data.use_verifier ?? true,
          auto_fallback_random: data.auto_fallback_random ?? false,
          local_base_url: data.local_base_url ?? 'http://localhost:11434/v1',
          github_token: data.github_token ?? '',
        });
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const cleanConfig = { ...config };
    const keyProviders: (keyof Config)[] = ['openai_api_keys', 'anthropic_api_keys', 'gemini_api_keys', 'groq_api_keys', 'vertexai_api_keys'];
    keyProviders.forEach(k => {
      if (Array.isArray(cleanConfig[k])) {
        (cleanConfig[k] as string[]) = (cleanConfig[k] as string[]).filter((val: string) => val.trim() !== '');
      }
    });

    try {
      await fetch(`${apiUrl}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: cleanConfig })
      });
      
      const btn = document.getElementById('saveBtn');
      if (btn) {
        btn.innerHTML = '<span class="flex items-center gap-2">Config Synced</span>';
        btn.classList.add('bg-emerald-600');
        setTimeout(() => {
          btn.innerHTML = '<span class="flex items-center gap-2">Sync Operations Logic</span>';
          btn.classList.remove('bg-emerald-600');
        }, 2000);
      }
    } catch {
      alert('Failed to save configuration matrix');
    }
    setSaving(false);
  };

  const handleKeyChange = (provider: keyof Config, index: number, value: string) => {
    const keys = config[provider];
    if (Array.isArray(keys)) {
      const newKeys = [...keys];
      newKeys[index] = value;
      setConfig({ ...config, [provider]: newKeys });
    }
  };

  const addKeyField = (provider: keyof Config) => {
    const keys = config[provider];
    if (Array.isArray(keys)) {
      setConfig({ ...config, [provider]: [...keys, ''] });
    }
  };

  const removeKeyField = (provider: keyof Config, index: number) => {
    const keys = config[provider];
    if (Array.isArray(keys)) {
      const newKeys = [...keys];
      newKeys.splice(index, 1);
      if (newKeys.length === 0) newKeys.push('');
      setConfig({ ...config, [provider]: newKeys });
    }
  };

  const selectModel = (roleType: string, modelId: string) => {
    setConfig({ ...config, [roleType]: modelId });
    setModelDropdown(null);
    setSearchModel('');
  };

  const filteredModels = popularModels.filter(m =>
    m.name.toLowerCase().includes(searchModel.toLowerCase()) ||
    m.provider.toLowerCase().includes(searchModel.toLowerCase()) ||
    m.id.toLowerCase().includes(searchModel.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const sectionVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <main className="min-h-screen text-white p-6 md:p-12 font-sans selection:bg-purple-500/30">
      <motion.div 
        className="max-w-5xl mx-auto space-y-12"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.header variants={sectionVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center pb-10 border-b border-white/5">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-white flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                <Settings className="w-8 h-8 text-white" />
              </div>
              Command Center
            </h1>
            <p className="text-gray-400 text-lg font-medium tracking-tight">Configure swarm parameters, neural logic, and compute credentials.</p>
          </div>
          <Link href="/" className="mt-8 md:mt-0 group flex items-center gap-3 bg-white/5 hover:bg-white/10 px-8 py-4 rounded-2xl border border-white/10 transition-all">
             <Terminal className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
             <span className="font-bold">Return to Uplink</span>
          </Link>
        </motion.header>

        <form onSubmit={handleSave} className="space-y-10">
          
          {/* Section 1: Swarm Operation */}
          <motion.section variants={sectionVariants} className="liquid-glass-panel p-10 space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                <Play className="w-5 h-5 text-fuchsia-500" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Operational Directives</h2>
            </div>

            <div className="flex items-center justify-between bg-white/[0.03] p-8 rounded-3xl border border-white/5 shadow-inner">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white tracking-tight">Master Swarm Uplink</h3>
                <p className="text-sm text-gray-400 font-medium">Engage or suspend the autonomous neural scanning mesh.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer group">
                <input type="checkbox" className="sr-only peer" checked={config.is_active || false} onChange={e => setConfig({...config, is_active: e.target.checked})} />
                <div className="w-20 h-10 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-10 after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-gray-400 after:rounded-full after:h-8 after:w-8 after:transition-all peer-checked:bg-purple-600 shadow-xl group-hover:scale-105 transition-transform"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Cpu className="w-3 h-3" /> Parallel Agents
                </label>
                <input type="number" min="1" max="20" value={config.max_agents || 4} onChange={e => setConfig({...config, max_agents: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-purple-500 transition-all font-mono text-xl font-black shadow-inner" />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Database className="w-3 h-3" /> Target Theme
                </label>
                <input type="text" placeholder="e.g. react, security" value={config.target_theme || ''} onChange={e => setConfig({...config, target_theme: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-purple-500 transition-all font-mono shadow-inner" />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <RefreshCw className="w-3 h-3" /> Max Age (Days)
                </label>
                <input type="number" value={config.max_repo_age_days || 30} onChange={e => setConfig({...config, max_repo_age_days: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-purple-500 transition-all font-mono text-xl font-black shadow-inner" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className={cn("flex items-center space-x-4 p-6 rounded-3xl border transition-all cursor-pointer", config.use_verifier ? "bg-purple-500/10 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]" : "bg-white/[0.02] border-white/5")}>
                <input type="checkbox" checked={config.use_verifier || false} onChange={e => setConfig({...config, use_verifier: e.target.checked})} className="w-6 h-6 rounded-lg bg-black border-white/20 text-purple-600 focus:ring-purple-500" />
                <div>
                  <div className="text-lg font-black text-white">Enforce Verification Gate</div>
                  <div className="text-xs text-gray-400 font-medium">Neural cross-check to eliminate false positives.</div>
                </div>
              </label>

              <label className={cn("flex items-center space-x-4 p-6 rounded-3xl border transition-all cursor-pointer", config.scan_issues ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "bg-white/[0.02] border-white/5")}>
                <input type="checkbox" checked={config.scan_issues || false} onChange={e => setConfig({...config, scan_issues: e.target.checked})} className="w-6 h-6 rounded-lg bg-black border-white/20 text-blue-600 focus:ring-blue-500" />
                <div>
                  <div className="text-lg font-black text-white">Remediate GitHub Issues</div>
                  <div className="text-xs text-gray-400 font-medium">Autonomous patching of open issue vectors.</div>
                </div>
              </label>
            </div>
          </motion.section>

          {/* Section 2: Model Matrix */}
          <motion.section variants={sectionVariants} className="liquid-glass-panel p-10 space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Intelligence Matrix</h2>
            </div>

            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
              <div className="space-y-1">
                <h4 className="text-sm font-black text-red-200">Cross-Provider Failover Mesh</h4>
                <p className="text-xs text-red-300/60 leading-relaxed font-medium">Automatic substitution logic will engage if primary nodes exhaust rate limits or experience latency spikes.</p>
                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input type="checkbox" checked={config.auto_fallback_random || false} onChange={e => setConfig({...config, auto_fallback_random: e.target.checked})} className="w-4 h-4 rounded bg-black border-red-500/30 text-red-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Activate Failover Mesh</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { id: 'finder_model', label: 'Finder Node', icon: <Search className="w-4 h-4"/> },
                { id: 'verifier_model', label: 'Verification Gate', icon: <Shield className="w-4 h-4"/> },
                { id: 'fixer_model', label: 'Resolution Core', icon: <Server className="w-4 h-4"/> }
              ].map((role) => (
                <div key={role.id} className="relative space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    {role.icon} {role.label}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setModelDropdown(modelDropdown === role.id ? null : role.id)}
                      className={cn(
                        "w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-left font-mono text-sm flex items-center justify-between group transition-all",
                        role.id === 'verifier_model' && !config.use_verifier && "opacity-30 cursor-not-allowed"
                      )}
                      disabled={role.id === 'verifier_model' && !config.use_verifier}
                    >
                      <span className="truncate">{config[role.id] || 'Select Node...'}</span>
                      <ChevronDown className={cn("w-4 h-4 text-gray-500 group-hover:text-white transition-all", modelDropdown === role.id && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {modelDropdown === role.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute z-50 mt-3 w-full bg-[#1a1525] border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl"
                        >
                          <div className="p-4 border-b border-white/5 relative">
                            <Search className="w-4 h-4 absolute left-7 top-7 text-gray-500" />
                            <input
                              autoFocus
                              type="text"
                              placeholder="Filter models..."
                              className="w-full bg-black/20 border border-white/5 rounded-xl p-3 pl-10 text-xs focus:outline-none focus:border-purple-500 transition-all"
                              value={searchModel}
                              onChange={(e) => setSearchModel(e.target.value)}
                            />
                          </div>
                          <div className="max-h-64 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {filteredModels.map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => selectModel(role.id, m.id)}
                                className="w-full p-4 hover:bg-white/5 rounded-2xl transition-all text-left flex flex-col gap-1 group"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-black text-sm group-hover:text-purple-400 transition-colors">{m.name}</span>
                                  <span className="text-[8px] font-black uppercase bg-white/5 text-gray-400 px-2 py-1 rounded-lg">{m.provider}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">{m.desc}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Server className="w-3 h-3" /> Local / Hybrid API Uplink
              </label>
              <input type="text" placeholder="http://localhost:11434/v1" value={config.local_base_url || ''} onChange={e => setConfig({...config, local_base_url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-purple-500 transition-all font-mono text-sm shadow-inner" />
            </div>
          </motion.section>

          {/* Section 3: Credentials */}
          <motion.section variants={sectionVariants} className="liquid-glass-panel p-10 space-y-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Credential Matrix</h2>
            </div>

            <div className="space-y-10">
              <div className="space-y-4 bg-emerald-500/5 p-8 rounded-3xl border border-emerald-500/10 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-8 opacity-5"><Key size={120} className="text-emerald-500" /></div>
                <div className="flex items-center justify-between relative z-10">
                  <label className="text-sm font-black text-emerald-400 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> GitHub Personal Access Token
                  </label>
                  <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/30">Write Access Required</span>
                </div>
                <input type="password" placeholder="ghp_xxxxxxxxxxxx" value={config.github_token || ''} onChange={e => setConfig({...config, github_token: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-emerald-100 font-mono text-sm focus:border-emerald-500 transition-all shadow-inner relative z-10" />
              </div>

              <div className="grid grid-cols-1 gap-10">
                {[
                  { id: 'openai_api_keys', label: 'OpenAI Nodes', placeholder: 'sk-proj-xxxxxxxx', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { id: 'anthropic_api_keys', label: 'Anthropic Nodes', placeholder: 'sk-ant-api03-xxxxxxxx', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                  { id: 'gemini_api_keys', label: 'Google Gemini Nodes', placeholder: 'AIzaSy...', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                  { id: 'groq_api_keys', label: 'Groq Speed Nodes', placeholder: 'gsk_...', color: 'text-rose-400', bg: 'bg-rose-500/10' },
                  { id: 'vertexai_api_keys', label: 'Vertex AI Cloud (JSON)', placeholder: '{ "type": "service_account"...', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                ].map((provider) => (
                  <div key={provider.id} className="space-y-6 pl-8 border-l-4 border-white/5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", provider.bg)}>
                          <Key className={cn("w-4 h-4", provider.color)} />
                        </div>
                        <label className="text-lg font-black tracking-tight">{provider.label}</label>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => addKeyField(provider.id)} 
                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Append Token
                      </button>
                    </div>
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {config[provider.id]?.map((key: string, idx: number) => (
                          <motion.div 
                            key={`${provider.id}-${idx}`}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-3 group"
                          >
                            <div className="bg-white/5 text-gray-500 text-[10px] font-black px-4 py-4 rounded-2xl border border-white/5 w-12 text-center shadow-inner">{idx + 1}</div>
                            <input
                              type="password"
                              placeholder={provider.placeholder}
                              value={key}
                              onChange={e => handleKeyChange(provider.id, idx, e.target.value)}
                              className="flex-1 bg-black/40 border border-white/5 group-hover:border-white/10 rounded-2xl p-4 text-white font-mono text-sm focus:border-purple-500 transition-all shadow-inner"
                            />
                            <button 
                              type="button" 
                              onClick={() => removeKeyField(provider.id, idx)} 
                              className="p-4 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.div variants={sectionVariants} className="pt-10 flex justify-end pb-32">
            <button 
              id="saveBtn" 
              type="submit" 
              disabled={saving} 
              className="group relative bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-[0.2em] py-5 px-12 rounded-3xl transition-all duration-300 disabled:opacity-50 flex items-center gap-4 border border-purple-400/30 shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:-translate-y-1 active:translate-y-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              <Save className="w-6 h-6" />
              {saving ? 'Synchronizing...' : 'Sync Operations Logic'}
            </button>
          </motion.div>
        </form>
      </motion.div>
      
      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </main>
  );
}
