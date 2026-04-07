"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings, Shield, Plus, X, Search, Terminal, Globe, Server, Bot, AlertTriangle, Play, ChevronDown } from 'lucide-react';

export default function Admin() {
  const [config, setConfig] = useState<any>({
    openai_api_keys: [''],
    anthropic_api_keys: [''],
    gemini_api_keys: [''],
    groq_api_keys: [''],
    vertexai_api_keys: ['']
  });
  const [saving, setSaving] = useState(false);
  const [searchModel, setSearchModel] = useState('');
  const [modelDropdown, setModelDropdown] = useState<string | null>(null); // 'finder', 'verifier', 'fixer'

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
        const safeArr = (val: any) => Array.isArray(val) && val.length > 0 ? val : [''];
        setConfig({
          ...data,
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
          openai_api_keys: safeArr(data.openai_api_keys),
          anthropic_api_keys: safeArr(data.anthropic_api_keys),
          gemini_api_keys: safeArr(data.gemini_api_keys),
          groq_api_keys: safeArr(data.groq_api_keys),
          vertexai_api_keys: safeArr(data.vertexai_api_keys),
        });
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Clean empty keys before saving
    const cleanConfig = { ...config };
    ['openai_api_keys', 'anthropic_api_keys', 'gemini_api_keys', 'groq_api_keys', 'vertexai_api_keys'].forEach(k => {
      cleanConfig[k] = cleanConfig[k].filter((val: string) => val.trim() !== '');
    });

    try {
      await fetch(`${apiUrl}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: cleanConfig })
      });
      // Flash success
      const btn = document.getElementById('saveBtn');
      if (btn) {
        btn.innerText = '✓ Settings Synced';
        btn.classList.add('bg-emerald-600');
        setTimeout(() => {
          btn.innerText = 'Commit Parameters';
          btn.classList.remove('bg-emerald-600');
        }, 2000);
      }
    } catch (e) {
      alert('Failed to save configuration matrix');
    }
    setSaving(false);
  };

  const handleKeyChange = (provider: string, index: number, value: string) => {
    const newKeys = [...config[provider]];
    newKeys[index] = value;
    setConfig({ ...config, [provider]: newKeys });
  };

  const addKeyField = (provider: string) => {
    setConfig({ ...config, [provider]: [...config[provider], ''] });
  };

  const removeKeyField = (provider: string, index: number) => {
    const newKeys = [...config[provider]];
    newKeys.splice(index, 1);
    if (newKeys.length === 0) newKeys.push(''); // Always keep one input
    setConfig({ ...config, [provider]: newKeys });
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

  return (
    <main className="min-h-screen text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-purple-900/50">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-500 neon-text flex items-center gap-3">
              <Settings className="w-10 h-10 text-purple-500" />
              Command Center
            </h1>
            <p className="text-purple-300 mt-2 font-medium">Configure swarm parameters, active logic, and API credentials.</p>
          </div>
          <Link href="/" className="mt-6 md:mt-0 flex items-center gap-2 text-gray-300 hover:text-white px-5 py-2.5 rounded-lg glass-panel hover:bg-purple-900/30 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]">
             <Terminal className="w-4 h-4" /> Return to Uplink
          </Link>
        </header>

        <form onSubmit={handleSave} className="space-y-8">

          {/* MASTER SWITCH & BEHAVIOR */}
          <section className="glass-panel p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-3 mb-2 border-b border-purple-900/40 pb-4">
              <Play className="w-6 h-6 text-fuchsia-500" />
              <h2 className="text-xl font-bold text-purple-100">Operation Directives</h2>
            </div>

            <div className="flex items-center justify-between bg-purple-950/20 p-5 rounded-xl border border-purple-900/30 shadow-inner">
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">Master Swarm Uplink</h3>
                <p className="text-sm text-purple-300">Engage or suspend the 24/7 autonomous scanning operation.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.is_active || false} onChange={e => setConfig({...config, is_active: e.target.checked})} />
                <div className="w-16 h-8 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:bg-white peer-checked:bg-gradient-to-r peer-checked:from-fuchsia-500 peer-checked:to-purple-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2 group">
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider">Parallel Agent Capacity</label>
                <input type="number" min="1" max="20" value={config.max_agents || 4} onChange={e => setConfig({...config, max_agents: parseInt(e.target.value)})} className="w-full bg-black/50 border border-purple-900/50 rounded-lg p-3 text-white focus:ring-fuchsia-500 focus:border-fuchsia-500 transition shadow-inner font-mono text-lg" />
              </div>

              <div className="space-y-2 group">
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider">Thematic Targeting (Optional)</label>
                <input type="text" placeholder="e.g. react, blockchain" value={config.target_theme || ''} onChange={e => setConfig({...config, target_theme: e.target.value})} className="w-full bg-black/50 border border-purple-900/50 rounded-lg p-3 text-white focus:ring-fuchsia-500 focus:border-fuchsia-500 transition shadow-inner font-mono" />
                <p className="text-[10px] text-purple-400/60 uppercase tracking-wide">Leave blank to randomly traverse trending nodes.</p>
              </div>

              <div className="space-y-2 group">
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider">Max Codebase Age (Days)</label>
                <input type="number" value={config.max_repo_age_days || 30} onChange={e => setConfig({...config, max_repo_age_days: parseInt(e.target.value)})} className="w-full bg-black/50 border border-purple-900/50 rounded-lg p-3 text-white focus:ring-fuchsia-500 focus:border-fuchsia-500 transition shadow-inner font-mono text-lg" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <label className="flex items-center space-x-3 p-4 bg-purple-950/20 rounded-xl border border-purple-900/30 cursor-pointer hover:bg-purple-900/30 transition">
                <input type="checkbox" checked={config.use_verifier || false} onChange={e => setConfig({...config, use_verifier: e.target.checked})} className="w-5 h-5 text-fuchsia-600 bg-black border-purple-800 rounded focus:ring-fuchsia-500 focus:ring-2" />
                <div>
                  <div className="text-sm font-bold text-purple-100">Enforce Verification Gate</div>
                  <div className="text-[10px] text-purple-300 uppercase tracking-wide mt-0.5">Drastically reduces false positives.</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 bg-purple-950/20 rounded-xl border border-purple-900/30 cursor-pointer hover:bg-purple-900/30 transition">
                <input type="checkbox" checked={config.scan_issues || false} onChange={e => setConfig({...config, scan_issues: e.target.checked})} className="w-5 h-5 text-fuchsia-600 bg-black border-purple-800 rounded focus:ring-fuchsia-500 focus:ring-2" />
                <div>
                  <div className="text-sm font-bold text-purple-100">Scan & Fix GitHub Issues</div>
                  <div className="text-[10px] text-purple-300 uppercase tracking-wide mt-0.5">Attempt to autonomously resolve open issues.</div>
                </div>
              </label>
            </div>
          </section>

          {/* INTELLIGENCE MATRIX (MODELS) */}
          <section className="glass-panel p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-3 mb-2 border-b border-purple-900/40 pb-4">
              <Bot className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl font-bold text-purple-100">Intelligence Matrix</h2>
            </div>

            <label className="flex items-start space-x-3 p-4 bg-red-950/20 rounded-xl border border-red-900/30 mb-6 cursor-pointer">
                <input type="checkbox" checked={config.auto_fallback_random || false} onChange={e => setConfig({...config, auto_fallback_random: e.target.checked})} className="w-5 h-5 mt-1 text-red-600 bg-black border-red-800 rounded focus:ring-red-500 focus:ring-2" />
                <div>
                  <div className="text-sm font-bold text-red-200 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Cross-Provider Failover</div>
                  <div className="text-xs text-red-300/80 mt-1">If all API keys for a provider exhaust their quota/limits, the swarm will automatically substitute a random model from an alternate provider to maintain 24/7 uptime.</div>
                </div>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'finder_model', label: 'Finder Node', icon: <Search className="w-4 h-4"/>, desc: 'Scans for vulnerabilities. Needs high speed.' },
                { id: 'verifier_model', label: 'Verification Gate', icon: <Shield className="w-4 h-4"/>, desc: 'Filters false positives. Disabled if unselected.' },
                { id: 'fixer_model', label: 'Resolution Core (High IQ)', icon: <Server className="w-4 h-4"/>, desc: 'Generates the final secure code patch.' }
              ].map((role) => (
                <div key={role.id} className="relative space-y-2">
                  <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    {role.icon} {role.label}
                  </label>
                  <p className="text-[10px] text-purple-400/60 h-6 leading-tight">{role.desc}</p>

                  <div className="relative">
                    <input
                      type="text"
                      value={config[role.id] || ''}
                      onChange={e => setConfig({...config, [role.id]: e.target.value})}
                      onFocus={() => setModelDropdown(role.id)}
                      placeholder="e.g. gpt-4o"
                      className="w-full bg-black/50 border border-purple-900/50 rounded-lg p-3 pr-10 text-fuchsia-200 font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                      disabled={role.id === 'verifier_model' && !config.use_verifier}
                    />
                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-purple-500 pointer-events-none" />
                  </div>

                  {/* Custom Dropdown */}
                  {modelDropdown === role.id && (
                    <div className="absolute z-50 mt-2 w-full max-h-80 overflow-y-auto bg-black/90 backdrop-blur-xl border border-purple-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] custom-scrollbar">
                      <div className="sticky top-0 bg-black/90 p-2 border-b border-purple-900/50 backdrop-blur-md">
                        <div className="relative">
                          <Search className="w-3 h-3 absolute left-3 top-2.5 text-purple-500"/>
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search models..."
                            className="w-full bg-purple-950/30 border border-purple-800/50 rounded flex-1 p-1.5 pl-8 text-xs text-white focus:outline-none"
                            value={searchModel}
                            onChange={(e) => setSearchModel(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="p-2 flex flex-col gap-1">
                        {filteredModels.slice(0, 5).map(m => (
                          <div
                            key={m.id}
                            onClick={() => selectModel(role.id, m.id)}
                            className="p-2 hover:bg-purple-900/40 rounded cursor-pointer transition flex flex-col gap-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm text-fuchsia-200">{m.name}</span>
                              <span className="text-[9px] uppercase bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded">{m.provider}</span>
                            </div>
                            <span className="text-xs text-purple-400/70">{m.desc}</span>
                          </div>
                        ))}
                        {filteredModels.length === 0 && <div className="p-3 text-xs text-center text-purple-500">No exact match. You can still use it!</div>}
                        <div className="p-2 mt-1 border-t border-purple-900/30 text-center text-[10px] text-purple-400/50 uppercase tracking-widest italic">
                          +98 other models available via search
                        </div>
                      </div>
                      <div className="sticky bottom-0 bg-black/90 p-2 border-t border-purple-900/50">
                        <button type="button" onClick={() => setModelDropdown(null)} className="w-full text-xs text-purple-400 hover:text-white transition py-1">Close</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-purple-900/30">
              <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2 mb-2"><Server className="w-4 h-4"/> Local / Custom Base URL</label>
              <input type="text" placeholder="http://localhost:11434/v1" value={config.local_base_url || ''} onChange={e => setConfig({...config, local_base_url: e.target.value})} className="w-full bg-black/50 border border-purple-900/50 rounded-lg p-3 text-white focus:ring-fuchsia-500 focus:border-fuchsia-500 transition shadow-inner font-mono text-sm" />
              <p className="text-[10px] text-purple-400/60 uppercase mt-2">Required if using Ollama, LM Studio, or vLLM endpoints.</p>
            </div>
          </section>

          {/* CREDENTIAL MATRIX */}
          <section className="glass-panel p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-3 mb-2 border-b border-purple-900/40 pb-4">
              <Globe className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-bold text-purple-100">Credential Matrix</h2>
            </div>
            <p className="text-xs text-purple-300/80 mb-6 max-w-2xl leading-relaxed">
              Keys are stored securely in the swarm's local SQL database. If multiple keys are provided for a service, they will be utilized in a round-robin fallback system. If a key depletes its quota, the swarm automatically pivots to the next available token.
            </p>

            <div className="space-y-8">
              <div className="space-y-3 bg-purple-950/10 p-5 rounded-xl border border-purple-900/20">
                <label className="text-sm font-bold text-emerald-400 flex items-center justify-between">
                    <span>GitHub Personal Access Token</span>
                    <span className="text-[10px] bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-800/50 tracking-wider">Required for PRs</span>
                </label>
                <input type="password" placeholder="ghp_xxxxxxxxxxxx" value={config.github_token || ''} onChange={e => setConfig({...config, github_token: e.target.value})} className="w-full bg-black/60 border border-emerald-900/50 rounded-lg p-3 text-emerald-100 font-mono text-sm focus:ring-emerald-500 shadow-inner" />
              </div>

              {/* Dynamic Key Lists */}
              {[
                { id: 'openai_api_keys', label: 'OpenAI API Keys', placeholder: 'sk-proj-xxxxxxxxxxxx', color: 'blue' },
                { id: 'anthropic_api_keys', label: 'Anthropic API Keys', placeholder: 'sk-ant-api03-xxxxxxxxxxxx', color: 'orange' },
                { id: 'gemini_api_keys', label: 'Google Gemini API Keys', placeholder: 'AIzaSy...', color: 'cyan' },
                { id: 'groq_api_keys', label: 'Groq API Keys', placeholder: 'gsk_...', color: 'rose' },
                { id: 'vertexai_api_keys', label: 'Vertex AI Credentials (JSON)', placeholder: '{ "type": "service_account"...', color: 'indigo' },
              ].map((provider) => (
                <div key={provider.id} className="space-y-3 pl-4 border-l-2 border-purple-800/50">
                  <div className="flex justify-between items-center">
                    <label className={`text-sm font-bold text-${provider.color}-400`}>{provider.label}</label>
                    <button type="button" onClick={() => addKeyField(provider.id)} className="text-[10px] uppercase font-bold tracking-wider text-purple-400 hover:text-white flex items-center gap-1 bg-purple-900/30 px-2 py-1 rounded transition"><Plus className="w-3 h-3"/> Add Key</button>
                  </div>
                  <div className="space-y-2">
                    {config[provider.id]?.map((key: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        <div className="bg-black/40 text-purple-500 text-xs font-mono px-2 py-3 rounded border border-purple-900/30 w-8 text-center">{idx + 1}</div>
                        <input
                          type="password"
                          placeholder={provider.placeholder}
                          value={key}
                          onChange={e => handleKeyChange(provider.id, idx, e.target.value)}
                          className="flex-1 bg-black/50 border border-purple-900/40 rounded-lg p-3 text-white font-mono text-sm focus:ring-purple-500 shadow-inner"
                        />
                        <button type="button" onClick={() => removeKeyField(provider.id, idx)} className="p-3 text-purple-600 hover:text-red-500 hover:bg-red-950/30 rounded-lg transition opacity-50 group-hover:opacity-100">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-6 flex justify-end pb-20">
            <button id="saveBtn" type="submit" disabled={saving} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] py-3 px-8 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 border border-purple-400/30">
              <Server className="w-5 h-5" />
              {saving ? 'Syncing...' : 'Commit Parameters'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
