"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Plus,
  X,
  Search,
  Server,
  Bot,
  AlertTriangle,
  ChevronDown,
  Save,
  Key,
  Cpu,
  RefreshCw,
  Database,
  CheckCircle2,
  Zap,
  Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
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

type ModelRole = "finder_model" | "verifier_model" | "fixer_model";
type KeyProvider =
  | "openai_api_keys"
  | "anthropic_api_keys"
  | "gemini_api_keys"
  | "groq_api_keys"
  | "vertexai_api_keys";

/* ─── Animation Variants ─── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

/* ─── Model Catalog ─── */
const popularModels = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", desc: "Flagship intelligence" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", desc: "Fast & affordable" },
  { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet", provider: "Anthropic", desc: "Best for code" },
  { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", provider: "Anthropic", desc: "Ultra fast" },
  { id: "gemini/gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google", desc: "Large context" },
  { id: "groq/llama3-70b-8192", name: "Llama 3 70B", provider: "Groq", desc: "Open weights" },
  { id: "local/llama3", name: "Local Llama 3", provider: "Local", desc: "Self-hosted" },
];

/* ─── Provider Config ─── */
const providerList: {
  id: KeyProvider;
  label: string;
  placeholder: string;
  color: string;
  bg: string;
}[] = [
  { id: "openai_api_keys", label: "OpenAI", placeholder: "sk-proj-...", color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "anthropic_api_keys", label: "Anthropic", placeholder: "sk-ant-api03-...", color: "text-orange-400", bg: "bg-orange-500/10" },
  { id: "gemini_api_keys", label: "Google Gemini", placeholder: "AIzaSy...", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { id: "groq_api_keys", label: "Groq", placeholder: "gsk_...", color: "text-rose-400", bg: "bg-rose-500/10" },
  { id: "vertexai_api_keys", label: "Vertex AI", placeholder: '{ "type": "service_account"...', color: "text-indigo-400", bg: "bg-indigo-500/10" },
];

/* ─── Model Role Config ─── */
const modelRoles: { id: ModelRole; label: string; desc: string; icon: typeof Search }[] = [
  { id: "finder_model", label: "Finder", desc: "Scans for vulnerabilities", icon: Search },
  { id: "verifier_model", label: "Verifier", desc: "Validates findings", icon: Shield },
  { id: "fixer_model", label: "Fixer", desc: "Generates patches", icon: Zap },
];

/* ─── Toggle Helper Component ─── */
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0",
        checked ? "bg-violet-600" : "bg-zinc-700"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

/* ═══════════════════════════════════════
   Admin Settings Page
   ═══════════════════════════════════════ */

export default function Admin() {
  const [config, setConfig] = useState<Config>({
    openai_api_keys: [""],
    anthropic_api_keys: [""],
    gemini_api_keys: [""],
    groq_api_keys: [""],
    vertexai_api_keys: [""],
    is_active: true,
    max_agents: 4,
    target_theme: "",
    max_repo_age_days: 30,
    scan_issues: false,
    finder_model: "gpt-4o-mini",
    verifier_model: "gpt-4o-mini",
    fixer_model: "gpt-4o",
    use_verifier: true,
    auto_fallback_random: false,
    local_base_url: "http://localhost:11434/v1",
    github_token: "",
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [searchModel, setSearchModel] = useState("");
  const [modelDropdown, setModelDropdown] = useState<ModelRole | null>(null);

  /* ─── Load config ─── */
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/config`)
      .then((res) => res.json())
      .then((data) => {
        const safeArr = (val: unknown) =>
          Array.isArray(val) && val.length > 0 ? val : [""];
        setConfig({
          openai_api_keys: safeArr(data.openai_api_keys),
          anthropic_api_keys: safeArr(data.anthropic_api_keys),
          gemini_api_keys: safeArr(data.gemini_api_keys),
          groq_api_keys: safeArr(data.groq_api_keys),
          vertexai_api_keys: safeArr(data.vertexai_api_keys),
          is_active: data.is_active ?? true,
          max_agents: data.max_agents ?? 4,
          target_theme: data.target_theme ?? "",
          max_repo_age_days: data.max_repo_age_days ?? 30,
          scan_issues: data.scan_issues ?? false,
          finder_model: data.finder_model ?? "gpt-4o-mini",
          verifier_model: data.verifier_model ?? "gpt-4o-mini",
          fixer_model: data.fixer_model ?? "gpt-4o",
          use_verifier: data.use_verifier ?? true,
          auto_fallback_random: data.auto_fallback_random ?? false,
          local_base_url: data.local_base_url ?? "http://localhost:11434/v1",
          github_token: data.github_token ?? "",
        });
      })
      .catch(console.error);
  }, []);

  /* ─── Save config ─── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState("saving");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const cleanConfig = { ...config };
    const keyProviders: KeyProvider[] = [
      "openai_api_keys",
      "anthropic_api_keys",
      "gemini_api_keys",
      "groq_api_keys",
      "vertexai_api_keys",
    ];
    keyProviders.forEach((k) => {
      cleanConfig[k] = cleanConfig[k].filter((val) => val.trim() !== "");
    });

    try {
      await fetch(`${apiUrl}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs: cleanConfig }),
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      alert("Failed to save configuration.");
      setSaveState("idle");
    }
  };

  /* ─── Key Helpers ─── */
  const handleKeyChange = (provider: KeyProvider, index: number, value: string) => {
    const newKeys = [...config[provider]];
    newKeys[index] = value;
    setConfig({ ...config, [provider]: newKeys });
  };
  const addKeyField = (provider: KeyProvider) => {
    setConfig({ ...config, [provider]: [...config[provider], ""] });
  };
  const removeKeyField = (provider: KeyProvider, index: number) => {
    const newKeys = [...config[provider]];
    newKeys.splice(index, 1);
    if (newKeys.length === 0) newKeys.push("");
    setConfig({ ...config, [provider]: newKeys });
  };

  /* ─── Model Selection ─── */
  const selectModel = (role: ModelRole, modelId: string) => {
    setConfig({ ...config, [role]: modelId });
    setModelDropdown(null);
    setSearchModel("");
  };

  const filteredModels = popularModels.filter(
    (m) =>
      m.name.toLowerCase().includes(searchModel.toLowerCase()) ||
      m.provider.toLowerCase().includes(searchModel.toLowerCase()) ||
      m.id.toLowerCase().includes(searchModel.toLowerCase())
  );

  return (
    <div className="p-8 lg:p-10 max-w-[900px] mx-auto">
      <motion.div
        className="space-y-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* ── Header ── */}
        <motion.div variants={item} className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-500">
            Configure swarm parameters, AI models, and credentials.
          </p>
        </motion.div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* ═══ Section 1: Swarm Control ═══ */}
          <motion.section variants={item} className="surface-card p-6 space-y-6">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-500" />
              Swarm Control
            </h2>

            {/* Master toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div>
                <p className="text-sm font-medium">Master Switch</p>
                <p className="text-xs text-zinc-600 mt-0.5">Enable or disable the scanning swarm.</p>
              </div>
              <Toggle
                checked={config.is_active}
                onChange={(v) => setConfig({ ...config, is_active: v })}
              />
            </div>

            {/* Numeric inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-3 h-3" /> Parallel Agents
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={config.max_agents}
                  onChange={(e) =>
                    setConfig({ ...config, max_agents: parseInt(e.target.value) || 1 })
                  }
                  className="form-input font-[family-name:var(--font-mono)]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3 h-3" /> Target Theme
                </label>
                <input
                  type="text"
                  placeholder="e.g. react, python"
                  value={config.target_theme}
                  onChange={(e) =>
                    setConfig({ ...config, target_theme: e.target.value })
                  }
                  className="form-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" /> Max Age (Days)
                </label>
                <input
                  type="number"
                  value={config.max_repo_age_days}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      max_repo_age_days: parseInt(e.target.value) || 30,
                    })
                  }
                  className="form-input font-[family-name:var(--font-mono)]"
                />
              </div>
            </div>

            {/* Feature toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className={cn(
                "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-150",
                config.use_verifier
                  ? "bg-violet-500/[0.06] border-violet-500/20"
                  : "bg-white/[0.01] border-white/[0.04] hover:border-white/[0.08]"
              )}>
                <div className="flex items-center gap-3">
                  <Shield className={cn("w-4 h-4", config.use_verifier ? "text-violet-400" : "text-zinc-600")} />
                  <div>
                    <p className="text-sm font-medium">Use Verifier</p>
                    <p className="text-[11px] text-zinc-600">Cross-check to reduce false positives.</p>
                  </div>
                </div>
                <Toggle
                  checked={config.use_verifier}
                  onChange={(v) => setConfig({ ...config, use_verifier: v })}
                />
              </label>

              <label className={cn(
                "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-150",
                config.scan_issues
                  ? "bg-blue-500/[0.06] border-blue-500/20"
                  : "bg-white/[0.01] border-white/[0.04] hover:border-white/[0.08]"
              )}>
                <div className="flex items-center gap-3">
                  <Bug className={cn("w-4 h-4", config.scan_issues ? "text-blue-400" : "text-zinc-600")} />
                  <div>
                    <p className="text-sm font-medium">Fix GitHub Issues</p>
                    <p className="text-[11px] text-zinc-600">Auto-patch open issues on repos.</p>
                  </div>
                </div>
                <Toggle
                  checked={config.scan_issues}
                  onChange={(v) => setConfig({ ...config, scan_issues: v })}
                />
              </label>
            </div>
          </motion.section>

          {/* ═══ Section 2: AI Models ═══ */}
          <motion.section variants={item} className="surface-card p-6 space-y-6">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Bot className="w-4 h-4 text-violet-500" />
              AI Models
            </h2>

            {/* Failover warning */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/10">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm text-amber-200/80">
                  If a provider hits rate limits, the swarm can auto-fallback to another.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Toggle
                    checked={config.auto_fallback_random}
                    onChange={(v) =>
                      setConfig({ ...config, auto_fallback_random: v })
                    }
                  />
                  <span className="text-xs font-medium text-amber-400">
                    Enable auto-failover
                  </span>
                </label>
              </div>
            </div>

            {/* Model selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modelRoles.map((role) => {
                const isDisabled = role.id === "verifier_model" && !config.use_verifier;
                return (
                  <div key={role.id} className="relative space-y-2">
                    <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <role.icon className="w-3 h-3" /> {role.label}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        !isDisabled &&
                        setModelDropdown(modelDropdown === role.id ? null : role.id)
                      }
                      className={cn(
                        "w-full form-input text-left flex items-center justify-between text-sm",
                        isDisabled && "opacity-30 cursor-not-allowed"
                      )}
                      disabled={isDisabled}
                    >
                      <span className="truncate font-[family-name:var(--font-mono)] text-xs">
                        {config[role.id] || "Select..."}
                      </span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-zinc-600 transition-transform duration-150",
                          modelDropdown === role.id && "rotate-180"
                        )}
                      />
                    </button>

                    {/* Dropdown */}
                    {modelDropdown === role.id && (
                      <div className="absolute z-50 mt-1 w-full bg-[#16161e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-2 border-b border-white/[0.06]">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input
                              autoFocus
                              type="text"
                              placeholder="Search models..."
                              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-violet-500/50 transition-colors"
                              value={searchModel}
                              onChange={(e) => setSearchModel(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto p-1 custom-scrollbar">
                          {filteredModels.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => selectModel(role.id, m.id)}
                              className="w-full p-3 hover:bg-white/[0.05] rounded-lg transition-colors text-left"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{m.name}</span>
                                <span className="text-[10px] font-medium text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded">
                                  {m.provider}
                                </span>
                              </div>
                              <span className="text-[11px] text-zinc-600">{m.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Local API URL */}
            <div className="space-y-2 pt-4 border-t border-white/[0.04]">
              <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3 h-3" /> Local API URL
              </label>
              <input
                type="text"
                placeholder="http://localhost:11434/v1"
                value={config.local_base_url}
                onChange={(e) =>
                  setConfig({ ...config, local_base_url: e.target.value })
                }
                className="form-input font-[family-name:var(--font-mono)] text-xs"
              />
            </div>
          </motion.section>

          {/* ═══ Section 3: Credentials ═══ */}
          <motion.section variants={item} className="surface-card p-6 space-y-6">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Key className="w-4 h-4 text-violet-500" />
              Credentials
            </h2>

            {/* GitHub Token */}
            <div className="space-y-2 p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> GitHub Token
                </label>
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  repo scope required
                </span>
              </div>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={config.github_token}
                onChange={(e) =>
                  setConfig({ ...config, github_token: e.target.value })
                }
                className="form-input font-[family-name:var(--font-mono)] text-xs"
              />
            </div>

            {/* Provider API Keys */}
            <div className="space-y-6">
              {providerList.map((provider) => (
                <div key={provider.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", provider.bg)}>
                        <Key className={cn("w-3 h-3", provider.color)} />
                      </div>
                      <span className="text-sm font-medium">{provider.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addKeyField(provider.id)}
                      className="text-[11px] font-medium text-zinc-500 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition-all"
                    >
                      <Plus className="w-3 h-3" /> Add Key
                    </button>
                  </div>

                  <div className="space-y-2 pl-8 border-l-2 border-white/[0.04]">
                    {config[provider.id].map((key: string, idx: number) => (
                      <div key={`${provider.id}-${idx}`} className="flex items-center gap-2 group">
                        <span className="text-[10px] text-zinc-700 font-[family-name:var(--font-mono)] w-5 text-right shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="password"
                          placeholder={provider.placeholder}
                          value={key}
                          onChange={(e) =>
                            handleKeyChange(provider.id, idx, e.target.value)
                          }
                          className="form-input flex-1 text-xs font-[family-name:var(--font-mono)]"
                        />
                        <button
                          type="button"
                          onClick={() => removeKeyField(provider.id, idx)}
                          className="p-2 text-zinc-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ═══ Save Button ═══ */}
          <motion.div variants={item} className="flex justify-end pb-16">
            <button
              type="submit"
              disabled={saveState === "saving"}
              className={cn(
                "flex items-center gap-2.5 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50",
                saveState === "saved"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0"
              )}
            >
              {saveState === "saving" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saveState === "saved" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Configuration
                </>
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
