import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  FolderGit2,
  Cpu,
  Palette,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Maximize2,
  Minimize2,
  Save,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  FileJson,
  Lock,
  Users,
  Compass,
  Server,
  Monitor,
  CheckCheck,
  Shield,
  Globe,
  HardDrive,
} from 'lucide-react';
import {
  AppSettings,
  GitConfig,
  ArchitectChatMessage,
  ContractSchema,
  AgentPersonasConfig,
  GlobalAiProviderConfig,
  AIProvider,
} from '../types/agentforge';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAgentPersonas } from '../context/AgentPersonaContext';
import {
  loadAppSettings,
  saveAppSettings,
  DEFAULT_SETTINGS,
  DEFAULT_AGENT_PERSONAS,
  DEFAULT_PRIMARY_AI_PROVIDER,
  PROVIDER_DEFAULT_MODELS,
} from '../services/settingsService';
import { aggregateUserDataForExport } from '../services/projectStorageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGitConfigSaved?: (newGitConfig: Partial<GitConfig>) => void;
  chatMessages?: ArchitectChatMessage[];
  currentContract?: ContractSchema;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onGitConfigSaved,
  chatMessages = [],
  currentContract,
}) => {
  const { themeMode, setThemeMode, density, setDensity } = useTheme();
  const { user, deleteAccount } = useAuth();
  const {
    personas,
    primaryAiProvider,
    updatePersonas,
    updatePrimaryAiProvider,
    resetPersonas,
    resetModelRoutes,
  } = useAgentPersonas();

  const [activeTab, setActiveTab] = useState<'integrations' | 'execution' | 'sandbox' | 'appearance' | 'personas' | 'privacy'>('integrations');
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());

  // Password visibility states
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showPrimaryApiKey, setShowPrimaryApiKey] = useState(false);

  // Status feedback
  const [saveSuccess, setSaveSuccess] = useState(false);

  // GDPR Data Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // GDPR Account Deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loaded = loadAppSettings();
      setSettings({
        ...loaded,
        themeMode,
        dashboardDensity: density,
        agentPersonas: personas,
        primaryAiProvider: primaryAiProvider,
      });
      setSaveSuccess(false);
      setExportSuccess(false);
      setIsDeleteDialogOpen(false);
      setDeleteConfirmText('');
      setDeleteError(null);
    }
  }, [isOpen, themeMode, density, personas, primaryAiProvider]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Sync theme and density with ThemeContext
    setThemeMode(settings.themeMode);
    setDensity(settings.dashboardDensity);

    // Sync personas with AgentPersonaContext
    if (settings.agentPersonas) {
      updatePersonas(settings.agentPersonas);
    }

    // Sync primary AI provider with AgentPersonaContext
    if (settings.primaryAiProvider) {
      updatePrimaryAiProvider(settings.primaryAiProvider);
    }

    saveAppSettings(settings, (newGit) => {
      if (onGitConfigSaved) {
        onGitConfigSaved(newGit);
      }
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all AgentForge settings, agent personas, and primary AI provider to default values?')) {
      setSettings({
        ...DEFAULT_SETTINGS,
        themeMode: 'dark',
        dashboardDensity: 'comfortable',
        agentPersonas: DEFAULT_AGENT_PERSONAS,
        primaryAiProvider: DEFAULT_PRIMARY_AI_PROVIDER,
      });
      setThemeMode('dark');
      setDensity('comfortable');
      resetPersonas();
      resetModelRoutes();
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const uid = user?.id || 'anonymous_architect';
      const fallbackContract: ContractSchema = currentContract || {
        version: 'v1.0.0',
        checksum: 'sha256:00000000',
        frozen: false,
        typesDefinition: '',
        apiEndpoints: [],
      };

      const exportBundle = await aggregateUserDataForExport(
        uid,
        user,
        chatMessages,
        fallbackContract
      );

      const jsonStr = JSON.stringify(exportBundle, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'agentforge-data-export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export data:', err);
      alert('Failed to generate export file. Please check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmAccountDeletion = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') return;

    try {
      setIsDeletingAccount(true);
      setDeleteError(null);

      const res = await deleteAccount();
      if (!res.success) {
        setDeleteError(res.error || 'Failed to delete account.');
        setIsDeletingAccount(false);
        return;
      }

      setIsDeletingAccount(false);
      setIsDeleteDialogOpen(false);
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || 'An unexpected error occurred during account deletion.');
      setIsDeletingAccount(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in select-text">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  AgentForge Settings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure integrations, execution parameters, appearance, and privacy
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Close Settings"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 px-6 pt-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('integrations')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'integrations'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-bold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>API & Integrations</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('execution')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'execution'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-bold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Execution Preferences</span>
            </button>

            {/* TAB: MicroVM Sandbox */}
            <button
              type="button"
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'sandbox'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-bold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>MicroVM Sandbox</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 font-mono">
                Hardware Isolated
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'appearance'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-bold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Appearance & UI</span>
            </button>

            {/* TAB: Agent Personas */}
            <button
              type="button"
              onClick={() => setActiveTab('personas')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'personas'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-bold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Agent Personas</span>
            </button>

            {/* GDPR/CCPA TAB: Data & Privacy */}
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-bold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Data & Privacy</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-mono">
                GDPR
              </span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ================= TAB A: API & INTEGRATIONS ================= */}
            {activeTab === 'integrations' && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                    <span className="font-semibold">Local Storage Isolation:</span> Credentials are encrypted in memory or stored in your browser session. Never committed to source code or logged into activity streams.
                  </div>
                </div>

                {/* GitHub PAT */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>GitHub Personal Access Token (PAT)</span>
                    </label>
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>Generate token</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showGithubToken ? 'text' : 'password'}
                      value={settings.githubToken}
                      onChange={(e) => setSettings({ ...settings, githubToken: e.target.value })}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGithubToken(!showGithubToken)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title={showGithubToken ? 'Hide token' : 'Show token'}
                    >
                      {showGithubToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Requires <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">repo</code> scope to create branches, push commit diffs, and open Pull Requests.
                  </p>
                </div>

                {/* Default Target Repository */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Default Target Repository</span>
                  </label>
                  <input
                    type="text"
                    value={settings.defaultRepo}
                    onChange={(e) => setSettings({ ...settings, defaultRepo: e.target.value })}
                    placeholder="username/my-nextjs-app"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    The target remote repository where Backend, Frontend, and QA workers submit pull requests.
                  </p>
                </div>

                {/* ================= PRIMARY AI PROVIDER CONFIGURATION SLOT ================= */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Primary AI Provider
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Controls the intelligence engine for all 4 agents across the pipeline (Lead Architect, Backend Worker, Frontend Worker, QA Worker).
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                      Global Pipeline Slot
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Provider Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Provider</span>
                        </label>
                        <select
                          value={settings.primaryAiProvider?.provider ?? 'gemini'}
                          onChange={(e) => {
                            const newProvider = e.target.value as AIProvider;
                            const defaultModel = PROVIDER_DEFAULT_MODELS[newProvider][0] || 'gemini-2.0-flash';
                            setSettings({
                              ...settings,
                              primaryAiProvider: {
                                ...(settings.primaryAiProvider || DEFAULT_PRIMARY_AI_PROVIDER),
                                provider: newProvider,
                                model: defaultModel,
                              },
                            });
                          }}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="gemini">Google Gemini (Default)</option>
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic Claude</option>
                          <option value="deepseek">DeepSeek</option>
                          <option value="ollama">Local (Ollama)</option>
                        </select>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Select the AI service provider driving contract generation, route handlers, UI components, and test suites.
                        </p>
                      </div>

                      {/* Dynamic Model Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Target Model</span>
                        </label>
                        <select
                          value={settings.primaryAiProvider?.model ?? 'gemini-2.0-flash'}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              primaryAiProvider: {
                                ...(settings.primaryAiProvider || DEFAULT_PRIMARY_AI_PROVIDER),
                                model: e.target.value,
                              },
                            });
                          }}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          {(
                            PROVIDER_DEFAULT_MODELS[settings.primaryAiProvider?.provider ?? 'gemini'] || [
                              'gemini-2.0-flash',
                              'gemini-1.5-flash',
                            ]
                          ).map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Defaults to Gemini models; dynamically updates based on chosen provider.
                        </p>
                      </div>
                    </div>

                    {/* Single Masked API Key Input with Eye Toggle */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Provider API Key</span>
                        </label>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {settings.primaryAiProvider?.provider === 'gemini'
                            ? 'Leave blank for platform-managed Gemini endpoint'
                            : 'Dedicated secret key'}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type={showPrimaryApiKey ? 'text' : 'password'}
                          value={settings.primaryAiProvider?.apiKey ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings({
                              ...settings,
                              geminiApiKey: settings.primaryAiProvider?.provider === 'gemini' ? val : settings.geminiApiKey,
                              openaiApiKey: settings.primaryAiProvider?.provider === 'openai' ? val : settings.openaiApiKey,
                              primaryAiProvider: {
                                ...(settings.primaryAiProvider || DEFAULT_PRIMARY_AI_PROVIDER),
                                apiKey: val,
                              },
                            });
                          }}
                          placeholder={
                            settings.primaryAiProvider?.provider === 'gemini'
                              ? 'AIzaSy... (optional, leave blank for platform-managed)'
                              : settings.primaryAiProvider?.provider === 'ollama'
                              ? 'http://localhost:11434'
                              : 'sk-...'
                          }
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPrimaryApiKey(!showPrimaryApiKey)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          title={showPrimaryApiKey ? 'Hide key' : 'Show key'}
                        >
                          {showPrimaryApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        This single credential is encrypted in session and applied globally across all workers in the pipeline.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB B: EXECUTION PREFERENCES ================= */}
            {activeTab === 'execution' && (
              <div className="space-y-5">
                {/* Execution Mode Toggle */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Execution Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Virtual Sandbox */}
                    <label
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all cursor-pointer ${
                        settings.executionMode === 'virtual'
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="executionMode"
                            value="virtual"
                            checked={settings.executionMode === 'virtual'}
                            onChange={() => setSettings({ ...settings, executionMode: 'virtual' })}
                            className="accent-indigo-600"
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Virtual Sandbox
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                          Safe Demo Mode
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-5">
                        Deterministic in-memory Git and component sandbox. No GitHub token required. Perfect for immediate prototyping and rapid iterations.
                      </p>
                    </label>

                    {/* Live Production */}
                    <label
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all cursor-pointer ${
                        settings.executionMode === 'live_github'
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="executionMode"
                            value="live_github"
                            checked={settings.executionMode === 'live_github'}
                            onChange={() => setSettings({ ...settings, executionMode: 'live_github' })}
                            className="accent-indigo-600"
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Live Production
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800/40">
                          Real Git / Actions
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-5">
                        Connects directly via Octokit REST API to push branches, create PRs, and stream real GitHub Actions CI webhook runs.
                      </p>
                    </label>
                  </div>
                </div>

                {/* Agent Concurrency */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Agent Worker Concurrency</span>
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                      {settings.agentConcurrency} Workers Parallel
                    </span>
                  </label>
                  <select
                    value={settings.agentConcurrency}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        agentConcurrency: Number(e.target.value) as 2 | 3 | 4,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={2}>2 Concurrent Workers (Conservative · Recommended for strict rate limits)</option>
                    <option value={3}>3 Concurrent Workers (Balanced · Lead + Backend + Frontend)</option>
                    <option value={4}>4 Concurrent Workers (Maximum Parallelism · Lead + Backend + Frontend + QA)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Controls how many specialized agents (Backend Worker, Frontend Worker, QA Engineer) can write code and run test suites concurrently after Gate 3 contract freeze.
                  </p>
                </div>
              </div>
            )}

            {/* ================= TAB: MICROVM SANDBOX ================= */}
            {activeTab === 'sandbox' && (
              <div className="space-y-6">
                {/* MicroVM Runtime Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span>MicroVM Sandboxing Architecture</span>
                    </label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50">
                      Hardware Isolated
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Replaces shared-kernel Docker containers with hardware-level microVMs. Each agent runs with its own dedicated Linux 6.1 kernel, preventing container escapes.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* Firecracker MicroVM */}
                    <label
                      className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all cursor-pointer ${
                        (settings.sandboxConfig?.runtime || 'firecracker_microvm') === 'firecracker_microvm'
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="sandboxRuntime"
                            value="firecracker_microvm"
                            checked={(settings.sandboxConfig?.runtime || 'firecracker_microvm') === 'firecracker_microvm'}
                            onChange={() =>
                              setSettings({
                                ...settings,
                                sandboxConfig: {
                                  ...(settings.sandboxConfig || {
                                    runtime: 'firecracker_microvm',
                                    defaultEgressPolicy: 'DENY',
                                    allowedDomains: ['registry.npmjs.org', 'github.com', 'api.github.com'],
                                    blockCloudMetadata: true,
                                    blockPrivateSubnets: true,
                                    secretProxyEnabled: true,
                                    memoryLimitMb: 1024,
                                    timeoutSeconds: 120,
                                  }),
                                  runtime: 'firecracker_microvm',
                                },
                              })
                            }
                            className="accent-indigo-600"
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            AWS Firecracker
                          </span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-5">
                        Dedicated Linux kernel via KVM (E2B SDK). Hardware virtualization isolates untrusted agent code.
                      </p>
                    </label>

                    {/* gVisor runsc */}
                    <label
                      className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all cursor-pointer ${
                        settings.sandboxConfig?.runtime === 'gvisor_sandbox'
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="sandboxRuntime"
                          value="gvisor_sandbox"
                          checked={settings.sandboxConfig?.runtime === 'gvisor_sandbox'}
                          onChange={() =>
                            setSettings({
                              ...settings,
                              sandboxConfig: {
                                ...(settings.sandboxConfig || {
                                  runtime: 'gvisor_sandbox',
                                  defaultEgressPolicy: 'DENY',
                                  allowedDomains: ['registry.npmjs.org', 'github.com', 'api.github.com'],
                                  blockCloudMetadata: true,
                                  blockPrivateSubnets: true,
                                  secretProxyEnabled: true,
                                  memoryLimitMb: 1024,
                                  timeoutSeconds: 120,
                                }),
                                runtime: 'gvisor_sandbox',
                              },
                            })
                          }
                          className="accent-indigo-600"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          gVisor (runsc)
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-5">
                        User-space syscall filter. Intercepts and validates kernel calls before host processing.
                      </p>
                    </label>

                    {/* Standard Container (Insecure) */}
                    <label
                      className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all cursor-pointer ${
                        settings.sandboxConfig?.runtime === 'standard_container'
                          ? 'bg-amber-50/80 dark:bg-amber-950/60 border-amber-600 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/30'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="sandboxRuntime"
                            value="standard_container"
                            checked={settings.sandboxConfig?.runtime === 'standard_container'}
                            onChange={() =>
                              setSettings({
                                ...settings,
                                sandboxConfig: {
                                  ...(settings.sandboxConfig || {
                                    runtime: 'standard_container',
                                    defaultEgressPolicy: 'DENY',
                                    allowedDomains: ['registry.npmjs.org', 'github.com', 'api.github.com'],
                                    blockCloudMetadata: true,
                                    blockPrivateSubnets: true,
                                    secretProxyEnabled: true,
                                    memoryLimitMb: 1024,
                                    timeoutSeconds: 120,
                                  }),
                                  runtime: 'standard_container',
                                },
                              })
                            }
                            className="accent-amber-600"
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Docker Container
                          </span>
                        </div>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Shared Kernel
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-5">
                        Shared Linux kernel. Vulnerable to kernel exploit container escapes. Not recommended for AI code.
                      </p>
                    </label>
                  </div>
                </div>

                {/* Network Egress Policy */}
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Network Egress Policies (Zero-Trust Filtering)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Block outbound exfiltration and protect internal cloud metadata services.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {/* Default Deny Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Default-Deny All Outbound Traffic
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Blocks all network requests except explicitly approved domains in the allowlist.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(settings.sandboxConfig?.defaultEgressPolicy ?? 'DENY') === 'DENY'}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              sandboxConfig: {
                                ...(settings.sandboxConfig || {
                                  runtime: 'firecracker_microvm',
                                  defaultEgressPolicy: 'DENY',
                                  allowedDomains: ['registry.npmjs.org', 'github.com', 'api.github.com'],
                                  blockCloudMetadata: true,
                                  blockPrivateSubnets: true,
                                  secretProxyEnabled: true,
                                  memoryLimitMb: 1024,
                                  timeoutSeconds: 120,
                                }),
                                defaultEgressPolicy: e.target.checked ? 'DENY' : 'ALLOW',
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    {/* Block Cloud Metadata (169.254.169.254) */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                      <div>
                        <div className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                          <span>Block Cloud Metadata (169.254.169.254)</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                            Critical Security
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Explicitly drops all traffic to RFC 3927 link-local addresses, preventing theft of master IAM credentials.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.sandboxConfig?.blockCloudMetadata ?? true}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              sandboxConfig: {
                                ...(settings.sandboxConfig || {
                                  runtime: 'firecracker_microvm',
                                  defaultEgressPolicy: 'DENY',
                                  allowedDomains: ['registry.npmjs.org', 'github.com', 'api.github.com'],
                                  blockCloudMetadata: true,
                                  blockPrivateSubnets: true,
                                  secretProxyEnabled: true,
                                  memoryLimitMb: 1024,
                                  timeoutSeconds: 120,
                                }),
                                blockCloudMetadata: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    {/* Block Private Subnets */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Block Private & Localhost Subnets (RFC 1918)
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Blocks 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, and 127.0.0.1 to prevent SSRF and internal port scanning.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.sandboxConfig?.blockPrivateSubnets ?? true}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              sandboxConfig: {
                                ...(settings.sandboxConfig || {
                                  runtime: 'firecracker_microvm',
                                  defaultEgressPolicy: 'DENY',
                                  allowedDomains: ['registry.npmjs.org', 'github.com', 'api.github.com'],
                                  blockCloudMetadata: true,
                                  blockPrivateSubnets: true,
                                  secretProxyEnabled: true,
                                  memoryLimitMb: 1024,
                                  timeoutSeconds: 120,
                                }),
                                blockPrivateSubnets: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Dynamic Secret Proxy */}
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Dynamic Secret Proxying (Zero Ambient Credentials)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        API keys and GitHub PATs are injected dynamically at the proxy layer and never passed to the sandbox's environment variables.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.sandboxConfig?.secretProxyEnabled ?? true}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            sandboxConfig: {
                              ...(settings.sandboxConfig || {
                                runtime: 'firecracker_microvm',
                                defaultEgressPolicy: 'DENY',
                                allowedDomains: ['registry.npmjs.org', 'github.com', 'api.github.com'],
                                blockCloudMetadata: true,
                                blockPrivateSubnets: true,
                                secretProxyEnabled: true,
                                memoryLimitMb: 1024,
                                timeoutSeconds: 120,
                              }),
                              secretProxyEnabled: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>

                {/* Compute Limits: Memory & Timeout */}
                <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-sky-500" />
                    <span>MicroVM Compute Quotas & Watchdogs</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Memory Limit Slider */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">RAM Ceiling</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {settings.sandboxConfig?.memoryLimitMb ?? 1024} MB
                        </span>
                      </div>
                      <input
                        type="range"
                        min="256"
                        max="4096"
                        step="256"
                        value={settings.sandboxConfig?.memoryLimitMb ?? 1024}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            sandboxConfig: {
                              ...(settings.sandboxConfig || {
                                runtime: 'firecracker_microvm',
                                defaultEgressPolicy: 'DENY',
                                allowedDomains: ['registry.npmjs.org', 'github.com', 'api.github.com'],
                                blockCloudMetadata: true,
                                blockPrivateSubnets: true,
                                secretProxyEnabled: true,
                                memoryLimitMb: 1024,
                                timeoutSeconds: 120,
                              }),
                              memoryLimitMb: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Hard cgroups v2 memory.max limit. Prevents OOM crashes of the host system.
                      </p>
                    </div>

                    {/* Timeout Slider */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Run Timeout</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {settings.sandboxConfig?.timeoutSeconds ?? 120} Seconds
                        </span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="600"
                        step="15"
                        value={settings.sandboxConfig?.timeoutSeconds ?? 120}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            sandboxConfig: {
                              ...(settings.sandboxConfig || {
                                runtime: 'firecracker_microvm',
                                defaultEgressPolicy: 'DENY',
                                allowedDomains: ['registry.npmjs.org', 'github.com', 'api.github.com'],
                                blockCloudMetadata: true,
                                blockPrivateSubnets: true,
                                secretProxyEnabled: true,
                                memoryLimitMb: 1024,
                                timeoutSeconds: 120,
                              }),
                              timeoutSeconds: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Watchdog timer forcefully terminates microVM if worker agent hangs in an infinite loop.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB C: APPEARANCE & UI ================= */}
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                {/* Theme Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Theme Preference
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, themeMode: 'system' })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        settings.themeMode === 'system'
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <Laptop className="w-5 h-5" />
                      <span className="text-xs font-semibold">System</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Auto match OS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, themeMode: 'dark' })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        settings.themeMode === 'dark'
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <Moon className="w-5 h-5" />
                      <span className="text-xs font-semibold">Dark IDE</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">High contrast code</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, themeMode: 'light' })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        settings.themeMode === 'light'
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <Sun className="w-5 h-5 text-amber-500" />
                      <span className="text-xs font-semibold">Light</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Clean daytime view</span>
                    </button>
                  </div>
                </div>

                {/* Dashboard Density */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Dashboard Density
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all cursor-pointer ${
                        settings.dashboardDensity === 'comfortable'
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="density"
                          value="comfortable"
                          checked={settings.dashboardDensity === 'comfortable'}
                          onChange={() => setSettings({ ...settings, dashboardDensity: 'comfortable' })}
                          className="accent-indigo-600"
                        />
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Comfortable</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 leading-normal">
                        Relaxed padding, standard typography, ideal for laptop and desktop screens.
                      </span>
                    </label>

                    <label
                      className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all cursor-pointer ${
                        settings.dashboardDensity === 'compact'
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="density"
                          value="compact"
                          checked={settings.dashboardDensity === 'compact'}
                          onChange={() => setSettings({ ...settings, dashboardDensity: 'compact' })}
                          className="accent-indigo-600"
                        />
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Compact</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 leading-normal">
                        Tighter gaps, condensed cards, and maximized information density for power engineers.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB: AGENT PERSONAS ================= */}
            {activeTab === 'personas' && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 flex items-start gap-3">
                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                    <span className="font-semibold">Custom Agent Personas:</span> Customize the names of your autonomous AI agents. These personalized names appear across the Kanban board, streaming orchestration logs, PR author tags, and chat avatars. Saved to your browser and persistent across sessions.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lead Architect */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white shrink-0">
                        <Compass className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Lead Architect</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Default: "Alex Vance"</span>
                      </div>
                    </div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Persona Display Name
                    </label>
                    <input
                      type="text"
                      value={settings.agentPersonas?.lead ?? DEFAULT_AGENT_PERSONAS.lead}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          agentPersonas: {
                            ...(settings.agentPersonas || DEFAULT_AGENT_PERSONAS),
                            lead: e.target.value,
                          },
                        })
                      }
                      placeholder="Alex Vance"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Discovery, RFC governance & invariant validation
                    </span>
                  </div>

                  {/* Backend Worker */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white shrink-0">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Backend Worker</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Default: "Marcus Blake"</span>
                      </div>
                    </div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Persona Display Name
                    </label>
                    <input
                      type="text"
                      value={settings.agentPersonas?.backend ?? DEFAULT_AGENT_PERSONAS.backend}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          agentPersonas: {
                            ...(settings.agentPersonas || DEFAULT_AGENT_PERSONAS),
                            backend: e.target.value,
                          },
                        })
                      }
                      placeholder="Marcus Blake"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      App Router route handlers, database schemas & token APIs
                    </span>
                  </div>

                  {/* Frontend Worker */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-sky-600 flex items-center justify-center text-white shrink-0">
                        <Monitor className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Frontend Worker</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Default: "Sarah Chen"</span>
                      </div>
                    </div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Persona Display Name
                    </label>
                    <input
                      type="text"
                      value={settings.agentPersonas?.frontend ?? DEFAULT_AGENT_PERSONAS.frontend}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          agentPersonas: {
                            ...(settings.agentPersonas || DEFAULT_AGENT_PERSONAS),
                            frontend: e.target.value,
                          },
                        })
                      }
                      placeholder="Sarah Chen"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Client UI components, forms & responsive styling
                    </span>
                  </div>

                  {/* QA Worker */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-600 flex items-center justify-center text-white shrink-0">
                        <CheckCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">QA Worker</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Default: "Elena Rostova"</span>
                      </div>
                    </div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Persona Display Name
                    </label>
                    <input
                      type="text"
                      value={settings.agentPersonas?.qa ?? DEFAULT_AGENT_PERSONAS.qa}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          agentPersonas: {
                            ...(settings.agentPersonas || DEFAULT_AGENT_PERSONAS),
                            qa: e.target.value,
                          },
                        })
                      }
                      placeholder="Elena Rostova"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Vitest contract specs & security validation
                    </span>
                  </div>
                </div>

                {/* Unified Intelligence Engine Banner */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Unified Intelligence Engine
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        All 4 agent personas run uniformly on your Primary AI Provider ({settings.primaryAiProvider?.provider?.toUpperCase() || 'GEMINI'} • {settings.primaryAiProvider?.model || 'gemini-2.0-flash'}).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('integrations')}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 cursor-pointer"
                  >
                    Configure Provider →
                  </button>
                </div>
              </div>
            )}

            {/* ================= TAB D: DATA & PRIVACY (GDPR / CCPA) ================= */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                {/* Information Header */}
                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                    <span className="font-semibold">Privacy Compliance:</span> Under GDPR Article 15 (Right of Access) and Article 17 (Right to Erasure / Right to be Forgotten), you retain full autonomy over your data, project documents, and credentials.
                  </div>
                </div>

                {/* 1. Export Data (Right to Access) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                        <FileJson className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                          Export My Data (Right to Access)
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          Download a complete, machine-readable JSON archive of your account profile, recent chat consultations with the Lead Architect, frozen contracts, and all saved projects from Cloud Firestore.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400">
                      File format: <code className="text-indigo-600 dark:text-indigo-400 font-semibold">agentforge-data-export.json</code>
                    </span>

                    <button
                      type="button"
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating Archive...</span>
                        </>
                      ) : exportSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Data (.json)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Delete Account (Right to be Forgotten - Danger Zone) */}
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        Danger Zone: Delete Account (Right to be Forgotten)
                      </h3>
                      <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5 leading-relaxed">
                        Permanently purge your account, revoke all session credentials, and delete all associated records in the <code className="font-mono">/projects</code> and <code className="font-mono">/chats</code> Firestore collections. This action is irreversible.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end border-t border-rose-200/60 dark:border-rose-900/40">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeleteDialogOpen(true);
                        setDeleteConfirmText('');
                        setDeleteError(null);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>

              {activeTab !== 'privacy' && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strict Account Deletion Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in select-text">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Confirm Account Deletion
                  </h3>
                  <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-semibold">
                    Irreversible GDPR Action
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              <p>
                This action <strong className="text-rose-600 dark:text-rose-400">permanently purges</strong> all documents associated with your UID in:
              </p>

              <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                <li><span className="text-slate-700 dark:text-slate-300">/projects</span> (All requirements & contracts)</li>
                <li><span className="text-slate-700 dark:text-slate-300">/chats</span> & <span className="text-slate-700 dark:text-slate-300">/threads</span> (Lead Architect transcripts)</li>
                <li><span className="text-slate-700 dark:text-slate-300">/users</span> (Your profile and permissions)</li>
                <li>Firebase Authentication record & active session cookies</li>
              </ul>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  To confirm, type <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">DELETE</span> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {deleteError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeletingAccount}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAccountDeletion}
                disabled={deleteConfirmText.trim() !== 'DELETE' || isDeletingAccount}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
