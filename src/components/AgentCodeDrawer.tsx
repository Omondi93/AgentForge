import React, { useState, useEffect } from 'react';
import {
  X,
  FileCode,
  ShieldCheck,
  GitBranch,
  Copy,
  Check,
  Download,
  ExternalLink,
  Layers,
  Cpu,
  Power,
  Server,
  Monitor,
  CheckCheck,
  Compass,
  Code2,
} from 'lucide-react';
import { ContractSchema, WorkerTask, AgentPersona } from '../types/agentforge';
import { useAgentPersonas } from '../context/AgentPersonaContext';
import { getWorkerFiles, WorkerSourceFile } from '../services/gitService';
import { SyntaxHighlighter } from './SyntaxHighlighter';

interface AgentCodeDrawerProps {
  persona: AgentPersona | 'lead' | string | null;
  isOpen: boolean;
  onClose: () => void;
  contract?: ContractSchema;
  tasks?: WorkerTask[];
  onOpenInFullViewer?: (path: string, branch: string) => void;
  featureDomain?: string;
}

const PERSONA_ICONS: Record<string, React.ElementType> = {
  lead: Compass,
  backend: Server,
  frontend: Monitor,
  qa: CheckCheck,
};

const PERSONA_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  lead: {
    bg: 'bg-indigo-600',
    text: 'text-indigo-400',
    border: 'border-indigo-500/40',
    glow: 'shadow-indigo-500/30',
  },
  backend: {
    bg: 'bg-emerald-600',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    glow: 'shadow-emerald-500/30',
  },
  frontend: {
    bg: 'bg-sky-600',
    text: 'text-sky-400',
    border: 'border-sky-500/40',
    glow: 'shadow-sky-500/30',
  },
  qa: {
    bg: 'bg-amber-600',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    glow: 'shadow-amber-500/30',
  },
};

export const AgentCodeDrawer: React.FC<AgentCodeDrawerProps> = ({
  persona,
  isOpen,
  onClose,
  contract,
  tasks = [],
  onOpenInFullViewer,
  featureDomain = 'auth',
}) => {
  const { getPersonaName, getGlobalModelBadge, fleetState } = useAgentPersonas();
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset selected file index when persona changes
  useEffect(() => {
    setSelectedFileIdx(0);
  }, [persona]);

  if (!isOpen || !persona) return null;

  const files: WorkerSourceFile[] = getWorkerFiles(persona, contract, featureDomain);
  const activeFile = files[selectedFileIdx] || files[0];
  const assignedTask = tasks.find((t) => t.persona === persona);

  const Icon = PERSONA_ICONS[persona] || Code2;
  const colors = PERSONA_COLORS[persona] || {
    bg: 'bg-violet-600',
    text: 'text-violet-400',
    border: 'border-violet-500/40',
    glow: 'shadow-violet-500/30',
  };

  const agentName = getPersonaName(persona as any);
  const isActive = persona === 'lead' || fleetState[persona] !== false;

  const handleCopyCurrentFile = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCurrentFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.path.split('/').pop() || 'source.ts';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Slide-over panel container */}
      <div className="w-full max-w-3xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-slate-900/95 border-b border-slate-800 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl ${colors.bg} text-white flex items-center justify-center font-bold text-lg shadow-lg ${colors.glow} shrink-0 ring-2 ring-white/20`}
            >
              <Icon className="w-6 h-6" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {agentName}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {persona.toUpperCase()} WORKER
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isActive
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isActive ? '● Active' : '○ Standby'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-mono text-[11px] text-indigo-300">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{activeFile?.branch || `feat/${persona}-worker`}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Cpu className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{getGlobalModelBadge()}</span>
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Scope: {activeFile?.scopeTag || 'Strict Invariant'}</span>
                </span>
                <span>•</span>
                <span className="text-indigo-300 font-mono text-[11px] flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>MicroVM: Firecracker Linux 6.1 · 1024MB · Proxied</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenInFullViewer && activeFile && (
              <button
                type="button"
                onClick={() => {
                  onOpenInFullViewer(activeFile.path, activeFile.branch);
                  onClose();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
                title="Open in primary Code & Files explorer tab"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Open in 📁 Code & Files</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close code viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Worker Task & Mission Summary Strip */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-slate-300 shrink-0">Mission:</span>
            <span className="text-slate-400 truncate">
              {assignedTask?.title || activeFile?.description || 'Autonomous specialist module delivery'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-slate-400">
            <span>Authored: <strong className="text-white">{files.length}</strong> files</span>
            <span>•</span>
            <span>Contract: <strong className="text-emerald-400">{contract?.version || 'v1.2.0'}</strong></span>
          </div>
        </div>

        {/* Tab Strip: Authored Files */}
        <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-2 bg-slate-900 border-b border-slate-800 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1.5">
            {files.map((file, idx) => {
              const isSelected = idx === selectedFileIdx;
              const fileName = file.path.split('/').pop() || file.path;

              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedFileIdx(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white font-semibold border border-indigo-500/50 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <FileCode
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-indigo-400' : 'text-slate-500'
                    }`}
                  />
                  <span>{fileName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({file.lines}L)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active File Metadata Bar */}
        {activeFile && (
          <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-500 font-mono text-[11px]">FILE:</span>
              <span className="font-mono text-cyan-300 font-semibold text-[11px] truncate">
                {activeFile.path}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                {activeFile.lines} lines · {activeFile.size}
              </span>

              <button
                type="button"
                onClick={handleCopyCurrentFile}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                title="Copy full source file"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadCurrentFile}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Code Content Viewport */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 flex flex-col">
          {activeFile ? (
            <SyntaxHighlighter
              code={activeFile.content}
              language={
                activeFile.path.endsWith('.tsx')
                  ? 'tsx'
                  : activeFile.path.endsWith('.json')
                  ? 'json'
                  : 'typescript'
              }
              showLineNumbers={true}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
              <span>No source files registered for this agent.</span>
            </div>
          )}
        </div>

        {/* Drawer Footer with Scope Guard Compliance Check */}
        <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Scope Guard Check: All line changes strictly match {activeFile?.scopeTag || 'policy'}.</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInFullViewer && activeFile && (
              <button
                type="button"
                onClick={() => {
                  onOpenInFullViewer(activeFile.path, activeFile.branch);
                  onClose();
                }}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer text-xs"
              >
                <span>View Full Workspace</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
