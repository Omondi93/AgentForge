import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  PanelLeft,
  Menu,
  Sun,
  Moon,
  Sparkles,
  LogOut,
  FolderGit2,
  Settings,
  ChevronDown,
  RefreshCw,
  Play,
  Rocket,
  ExternalLink,
  Loader2,
  GitBranch,
  Plus,
  Zap,
  Download,
  Copy,
  Check,
  Leaf,
} from 'lucide-react';
import {
  GitEngineMode,
  PlanningStage,
  DeploymentState,
  DeploymentProvider,
  TelemetryMetrics,
} from '../types/agentforge';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export interface HeaderProps {
  onRunSimulation?: () => void;
  isSimulating?: boolean;
  onReset?: () => void;
  gitMode?: GitEngineMode;
  onOpenGitConfig?: () => void;
  onOpenSettings?: () => void;
  onOpenMyProjects?: () => void;
  savedProjectsCount?: number;
  stage?: PlanningStage;
  deploymentState?: DeploymentState;
  onDeployToProduction?: (provider?: DeploymentProvider) => void;
  isDeploying?: boolean;
  onViewPreviewTab?: () => void;
  viewMode?: 'executive' | 'developer';
  onViewModeChange?: (mode: 'executive' | 'developer') => void;
  onToggleMobileSidebar?: () => void;
  onToggleCollapse?: () => void;
  sidebarCollapsed?: boolean;
  telemetry?: TelemetryMetrics;
  onDownloadZip?: () => void;
  onPushToGitHub?: () => void;
  onCopyContract?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRunSimulation,
  isSimulating = false,
  onReset,
  gitMode = 'virtual',
  onOpenGitConfig,
  onOpenSettings,
  onOpenMyProjects,
  savedProjectsCount = 0,
  stage,
  deploymentState,
  onDeployToProduction,
  isDeploying = false,
  onViewPreviewTab,
  viewMode = 'executive',
  onViewModeChange,
  onToggleMobileSidebar,
  onToggleCollapse,
  sidebarCollapsed = false,
  telemetry,
  onDownloadZip,
  onPushToGitHub,
  onCopyContract,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const telemetryRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const isExecutionPhase =
    stage && ['executing', 'ci_waiting', 'ci_failed', 'merged'].includes(stage);
  const isMerged = stage === 'merged';

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (telemetryRef.current && !telemetryRef.current.contains(target)) {
        setIsTelemetryOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur sticky top-0 z-20 transition-colors duration-200">
      {/* Zone 1: Sidebar Toggle & Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile Sidebar Toggle */}
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            title="Open side navigation"
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Sidebar Collapse Toggle */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* AgentForge Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              AgentForge
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline leading-none">
              Autonomous Fleet Sandbox
            </span>
          </div>
        </div>

        {/* Quick New Chat Button */}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            title="Start new chat / return to landing hero"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs ml-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        )}
      </div>

      {/* Zone 2: Minimalist Center/Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Optional View Switcher (only shown in active execution phase) */}
        {isExecutionPhase && onViewModeChange && (
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs mr-1">
            <button
              type="button"
              onClick={() => onViewModeChange('executive')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                viewMode === 'executive'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <span>Executive</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('developer')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                viewMode === 'developer'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <span>Developer</span>
            </button>
          </div>
        )}

        {/* 🚀 Export / Deploy Dropdown Menu */}
        <div className="relative shrink-0" ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
            title="Export virtual codebase, download ZIP, or deploy to production"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export / Deploy</span>
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 text-xs animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  onDownloadZip?.();
                  setIsExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">Download ZIP Archive</span>
                  <span className="text-[10px] text-slate-400">Export virtual file system</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onPushToGitHub?.();
                  setIsExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <GitBranch className="w-4 h-4 text-purple-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">Push to GitHub</span>
                  <span className="text-[10px] text-slate-400">Branch & Pull Request</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onCopyContract?.();
                  setIsExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <Copy className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">Copy Contract JSON</span>
                  <span className="text-[10px] text-slate-400">Finalized schema contract</span>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                type="button"
                onClick={() => {
                  onDeployToProduction?.();
                  setIsExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <Rocket className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">Deploy to Vercel</span>
                  <span className="text-[10px] text-slate-400">Trigger edge deployment</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* ⚡ Live Token & Cost Telemetry Widget */}
        <div className="relative shrink-0" ref={telemetryRef}>
          <button
            type="button"
            onClick={() => setIsTelemetryOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer select-none"
            title="Session Token & Cost Telemetry (Click for detailed breakdown)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="text-[11px] sm:text-xs font-mono font-semibold">
              {(telemetry?.totalTokens || 12480).toLocaleString()}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">·</span>
            <span className="text-[11px] sm:text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
              ${(telemetry?.estimatedCost || 0.018).toFixed(3)}
            </span>
            {telemetry && telemetry.tokensSaved > 0 && (
              <span className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                <Leaf className="w-2.5 h-2.5" />
                <span>{(telemetry.tokensSaved / 1000).toFixed(1)}k saved</span>
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Telemetry Popover Breakdown */}
          {isTelemetryOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3.5 z-50 text-xs animate-in fade-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Session Telemetry</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  Gemini 2.0 Flash
                </span>
              </div>

              {/* Total Tokens & Cost Cards */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    TOTAL TOKENS
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    {(telemetry?.totalTokens || 12480).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    P: {(telemetry?.promptTokens || 8200).toLocaleString()} · C:{' '}
                    {(telemetry?.completionTokens || 4280).toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    ESTIMATED COST
                  </span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ${(telemetry?.estimatedCost || 0.018).toFixed(4)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    @ $0.10/M In · $0.40/M Out
                  </span>
                </div>
              </div>

              {/* Dormant Agent Tokens Saved */}
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      Dormant Agent Savings
                    </span>
                    <span className="text-[9px] text-emerald-700/80 dark:text-emerald-400/80">
                      Tokens conserved via sleep toggles
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-xs">
                    +{(telemetry?.tokensSaved || 4800).toLocaleString()}
                  </span>
                  <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                    saved
                  </span>
                </div>
              </div>

              {/* Per-Agent Breakdown */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Per-Worker Consumption
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" /> Alex Vance (Lead)
                    </span>
                    <span>{(telemetry?.breakdown?.lead || 5200).toLocaleString()} tok</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500" /> Backend Worker
                    </span>
                    <span>{(telemetry?.breakdown?.backend || 3600).toLocaleString()} tok</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Frontend Worker
                    </span>
                    <span>{(telemetry?.breakdown?.frontend || 2400).toLocaleString()} tok</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> QA Worker
                    </span>
                    <span>{(telemetry?.breakdown?.qa || 1280).toLocaleString()} tok</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Minimalist Model Indicator: "Powered by Gemini 2.0 Flash" */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 select-none">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
          <span className="text-[11px] sm:text-xs font-medium tracking-tight whitespace-nowrap">
            Powered by <span className="font-semibold text-indigo-600 dark:text-indigo-300">Gemini 2.0 Flash</span>
          </span>
        </div>

        {/* Global Theme Switch (Light/Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shrink-0 cursor-pointer shadow-2xs"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative shrink-0" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            title={user ? `${user.name} (${user.email})` : 'Account menu'}
            className="flex items-center gap-1.5 p-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name || 'User'}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white text-xs font-bold flex items-center justify-center">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400 mr-0.5" />
          </button>

          {/* User Profile Popover Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 text-xs animate-fade-in">
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name || 'Architect User'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                  {user?.email || 'Authenticated User'}
                </p>
              </div>

              <div className="py-1">
                {onOpenMyProjects && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenMyProjects();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-indigo-500" />
                      <span>My Projects</span>
                    </div>
                    {savedProjectsCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {savedProjectsCount}
                      </span>
                    )}
                  </button>
                )}

                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Workspace Settings</span>
                  </button>
                )}

                {onReset && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onReset();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                    <span>New Architectural Session</span>
                  </button>
                )}
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
