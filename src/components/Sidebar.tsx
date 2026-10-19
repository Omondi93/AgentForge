import React from 'react';
import {
  Layers,
  Plus,
  LayoutDashboard,
  FolderGit2,
  MessageSquare,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bot,
  Sparkles,
  User,
  X,
  History,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { PlanningStage, ProjectSnapshot } from '../types/agentforge';
import { useAuth } from '../context/AuthContext';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNewProject: () => void;
  onSelectDashboard: () => void;
  onOpenMyProjects: () => void;
  savedProjectsCount: number;
  onOpenChatHistory: () => void;
  chatMessagesCount: number;
  activeFeatureName?: string;
  stage: PlanningStage;
  onOpenSettings: () => void;
  onOpenTerms: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activeNav?: 'dashboard' | 'projects' | 'chat';
  snapshots?: ProjectSnapshot[];
  onRollbackSnapshot?: (snapshotId: string) => void;
  onCreateSnapshot?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onNewProject,
  onSelectDashboard,
  onOpenMyProjects,
  savedProjectsCount,
  onOpenChatHistory,
  chatMessagesCount,
  activeFeatureName,
  stage,
  onOpenSettings,
  onOpenTerms,
  mobileOpen,
  onCloseMobile,
  activeNav = 'dashboard',
  snapshots = [],
  onRollbackSnapshot,
  onCreateSnapshot,
}) => {
  const { user, logout } = useAuth();

  const getStageLabel = () => {
    switch (stage) {
      case 'discovery':
      case 'requirements_approval':
        return 'Gate 1 Discovery';
      case 'task_planning':
        return 'Gate 2 Task Plan';
      case 'contract_freeze':
        return 'Gate 3 Freeze';
      case 'executing':
        return 'Workers Active';
      case 'ci_waiting':
      case 'ci_failed':
        return 'CI Triage';
      case 'merged':
        return 'Stage 5 Live';
      default:
        return 'Active Session';
    }
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between select-none">
      {/* ================= TOP SECTION ================= */}
      <div className="flex flex-col gap-3 p-3">
        {/* Brand & Collapse Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  AgentForge
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  Autonomous Multi-Agent
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar (w-64)' : 'Collapse sidebar'}
            className="hidden md:flex p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ➕ Primary Action: New Project */}
        <button
          type="button"
          onClick={() => {
            onNewProject();
            onCloseMobile();
          }}
          title="Start fresh blank architectural project"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs shadow-sm shadow-indigo-600/20 transition-all cursor-pointer ${
            collapsed ? 'justify-center p-2.5' : 'w-full'
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>New Project</span>}
        </button>

        {/* 📊 Primary Nav: Dashboard / Active Agent */}
        <button
          type="button"
          onClick={() => {
            onSelectDashboard();
            onCloseMobile();
          }}
          title="Active Feature & Agent Workspace"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeNav === 'dashboard'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          } ${collapsed ? 'justify-center p-2.5' : 'w-full'}`}
        >
          <div className="relative shrink-0">
            <LayoutDashboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col text-left min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate">Active Workspace</span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                  {getStageLabel()}
                </span>
              </div>
              {activeFeatureName && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {activeFeatureName}
                </span>
              )}
            </div>
          )}
        </button>
      </div>

      {/* ================= MIDDLE SECTION: HISTORY & PERSISTENCE ================= */}
      <div className="flex flex-col gap-1 px-3 py-2 flex-1 overflow-y-auto">
        {!collapsed && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
            History & Persistence
          </span>
        )}

        {/* 📂 My Projects */}
        <button
          type="button"
          onClick={() => {
            onOpenMyProjects();
            onCloseMobile();
          }}
          title={`My Projects (${savedProjectsCount} archived builds)`}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer group ${
            activeNav === 'projects'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800/60'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          } ${collapsed ? 'justify-center p-2.5' : 'w-full'}`}
        >
          <FolderGit2 className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0" />
          {!collapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">My Projects</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {savedProjectsCount}
              </span>
            </div>
          )}
        </button>

        {/* 💬 Chat History */}
        <button
          type="button"
          onClick={() => {
            onOpenChatHistory();
            onCloseMobile();
          }}
          title={`Chat History (${chatMessagesCount} messages)`}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer group ${
            activeNav === 'chat'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800/60'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          } ${collapsed ? 'justify-center p-2.5' : 'w-full'}`}
        >
          <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0" />
          {!collapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">Chat History</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {chatMessagesCount}
              </span>
            </div>
          )}
        </button>

        {/* 🕒 Timeline Snapshots (Time-Travel) */}
        {!collapsed ? (
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <History className="w-3 h-3 text-indigo-500" />
                <span>Timeline Snapshots</span>
              </span>
              {onCreateSnapshot && (
                <button
                  type="button"
                  onClick={onCreateSnapshot}
                  title="Bookmark current virtual files & contract state"
                  className="px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer text-[10px] font-semibold flex items-center gap-1"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Snapshot</span>
                </button>
              )}
            </div>

            {/* Snapshot list */}
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-0.5">
              {snapshots.length === 0 ? (
                <div className="px-2 py-3 text-[10px] text-slate-400 dark:text-slate-500 font-mono text-center">
                  No snapshots yet. Merges auto-snapshot.
                </div>
              ) : (
                snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-2 rounded-xl bg-slate-100/70 dark:bg-slate-900/90 hover:bg-slate-200/70 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 transition-all flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                        {snap.name}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 shrink-0">
                        {snap.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[9px]">
                        {snap.fileCount} files · {snap.authorPersona || 'lead'}
                      </span>
                      {onRollbackSnapshot && (
                        <button
                          type="button"
                          onClick={() => onRollbackSnapshot(snap.id)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 font-medium text-[10px] transition-colors cursor-pointer"
                          title="Restore virtual files, contract, and stage to this snapshot"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Rollback</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onToggleCollapse}
              title={`Timeline Snapshots (${snapshots.length})`}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer relative"
            >
              <History className="w-4 h-4" />
              {snapshots.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* ================= BOTTOM SECTION: SYSTEM & USER ================= */}
      <div className="flex flex-col gap-1 p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        {!collapsed && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-0.5">
            System & User
          </span>
        )}

        {/* ⚙️ Settings */}
        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          title="Configure API integrations, execution mode & appearance"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group ${
            collapsed ? 'justify-center p-2.5' : 'w-full'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>

        {/* 🛡️ Terms & Privacy */}
        <button
          type="button"
          onClick={() => {
            onOpenTerms();
            onCloseMobile();
          }}
          title="Review AI code generation terms & safety disclaimers"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group ${
            collapsed ? 'justify-center p-2.5' : 'w-full'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-slate-500 group-hover:text-amber-500 shrink-0" />
          {!collapsed && <span>Terms & Privacy</span>}
        </button>

        {/* 👤 User Profile & Sign Out (Moved from top header) */}
        {user && (
          <div
            className={`mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2 ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-indigo-400"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
              )}

              {!collapsed && (
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[110px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                    {user.email || user.role}
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ================= DESKTOP PERSISTENT SIDEBAR ================= */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 z-30 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {navContent}
      </aside>

      {/* ================= MOBILE OFF-CANVAS DRAWER ================= */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-10 flex flex-col">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
