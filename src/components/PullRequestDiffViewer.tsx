import React, { useState, useMemo } from 'react';
import {
  GitPullRequest,
  File,
  FileCode,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Copy,
  Check,
  Download,
  Split,
  AlignJustify,
  GitBranch,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  User,
  Layers,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { PullRequestState, FileDiff, ContractSchema, AgentPersona } from '../types/agentforge';
import { useAgentPersonas } from '../context/AgentPersonaContext';
import { gitService, getWorkerFiles, WorkerSourceFile } from '../services/gitService';
import { SyntaxHighlighter } from './SyntaxHighlighter';

interface PullRequestDiffViewerProps {
  pullRequests: Record<string, PullRequestState>;
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
  selectedFilePath: string;
  onSelectFilePath: (path: string) => void;
  diffViewMode: 'unified' | 'split';
  onChangeDiffViewMode: (mode: 'unified' | 'split') => void;
  onToggleScopeViolation?: () => void;
  onApplyFix?: () => void;
  isAgentFixing?: boolean;
  contract?: ContractSchema;
  onInspectWorker?: (persona: string) => void;
}

interface FileTreeItem {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children?: FileTreeItem[];
  authorPersona?: string;
  diff?: FileDiff;
  lines?: number;
  size?: string;
  content?: string;
}

export const PullRequestDiffViewer: React.FC<PullRequestDiffViewerProps> = ({
  pullRequests,
  selectedBranch,
  onSelectBranch,
  selectedFilePath,
  onSelectFilePath,
  diffViewMode,
  onChangeDiffViewMode,
  onToggleScopeViolation,
  onApplyFix,
  isAgentFixing,
  contract,
  onInspectWorker,
}) => {
  const { getPersonaName } = useAgentPersonas();

  // Mode Switcher: 'files' (Full File Tree Explorer) vs 'diffs' (Git Pull Request Diffs)
  const [activeViewerMode, setActiveViewerMode] = useState<'files' | 'diffs'>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPersona, setFilterPersona] = useState<string>('all');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const currentPr = pullRequests[selectedBranch];
  const branches = Object.keys(pullRequests);

  // Compile all virtual files across workers
  const allWorkerFiles = useMemo(() => {
    const backend = getWorkerFiles('backend', contract);
    const frontend = getWorkerFiles('frontend', contract);
    const qa = getWorkerFiles('qa', contract);
    const lead = getWorkerFiles('lead', contract);
    return [...lead, ...backend, ...frontend, ...qa];
  }, [contract]);

  // Map of file paths to source file info
  const fileSourceMap = useMemo(() => {
    const map = new Map<string, WorkerSourceFile>();
    allWorkerFiles.forEach((f) => map.set(f.path, f));
    return map;
  }, [allWorkerFiles]);

  // Current active diff (if in diff mode)
  const activeDiff: FileDiff | undefined =
    currentPr?.diffs.find((d) => d.path === selectedFilePath) || currentPr?.diffs[0];

  // Current active source file
  const activeFilePath = selectedFilePath || activeDiff?.path || allWorkerFiles[0]?.path || 'app/api/auth/login/route.ts';
  const activeSourceFile = fileSourceMap.get(activeFilePath) || {
    path: activeFilePath,
    content: activeDiff?.newContent || '// File loaded from virtual workspace',
    description: 'Autonomous agent virtual source file',
    authorPersona: currentPr?.authorPersona || 'backend',
    branch: selectedBranch || 'main',
    lines: (activeDiff?.newContent || '').split('\n').length || 1,
    size: '1.2 kB',
    scopeTag: 'workspace/*',
  };

  const hasScopeViolations =
    (currentPr?.scopeViolations && currentPr.scopeViolations.length > 0) ||
    currentPr?.diffs.some((d) => d.isScopeViolation);

  // Build hierarchical folder tree
  const fileTree = useMemo(() => {
    const root: FileTreeItem[] = [];

    // Filter files by search and persona
    const filtered = allWorkerFiles.filter((f) => {
      const matchesSearch = !searchQuery.trim() || f.path.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPersona = filterPersona === 'all' || f.authorPersona === filterPersona;
      return matchesSearch && matchesPersona;
    });

    filtered.forEach((file) => {
      const parts = file.path.split('/');
      let currentLevel = root;

      parts.forEach((part, idx) => {
        const isLast = idx === parts.length - 1;
        const currentPath = parts.slice(0, idx + 1).join('/');

        if (isLast) {
          // File node
          const matchingDiff = currentPr?.diffs.find((d) => d.path === file.path);
          currentLevel.push({
            name: part,
            fullPath: file.path,
            isFolder: false,
            authorPersona: file.authorPersona,
            diff: matchingDiff,
            lines: file.lines,
            size: file.size,
            content: file.content,
          });
        } else {
          // Folder node
          let folderNode = currentLevel.find((n) => n.isFolder && n.name === part);
          if (!folderNode) {
            folderNode = {
              name: part,
              fullPath: currentPath,
              isFolder: true,
              children: [],
            };
            currentLevel.push(folderNode);
          }
          currentLevel = folderNode.children!;
        }
      });
    });

    return root;
  }, [allWorkerFiles, searchQuery, filterPersona, currentPr]);

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const handleCopyCode = () => {
    const codeToCopy = activeSourceFile.content || activeDiff?.newContent || '';
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const code = activeSourceFile.content || activeDiff?.newContent || '';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFilePath.split('/').pop() || 'code.ts';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to parse patch into lines with types for Git Diffs mode
  const parsedDiffLines = useMemo(() => {
    if (!activeDiff?.patch) return [];
    const rawLines = activeDiff.patch.split('\n');
    let oldLineNum = 1;
    let newLineNum = 1;

    return rawLines.map((line) => {
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          oldLineNum = parseInt(match[1], 10);
          newLineNum = parseInt(match[2], 10);
        }
        return { type: 'chunk', text: line, oldNum: null, newNum: null };
      }
      if (line.startsWith('+')) {
        const item = { type: 'addition', text: line.substring(1), oldNum: null, newNum: newLineNum };
        newLineNum++;
        return item;
      }
      if (line.startsWith('-')) {
        const item = { type: 'deletion', text: line.substring(1), oldNum: oldLineNum, newNum: null };
        oldLineNum++;
        return item;
      }
      const item = {
        type: 'context',
        text: line.startsWith(' ') ? line.substring(1) : line,
        oldNum: oldLineNum,
        newNum: newLineNum,
      };
      oldLineNum++;
      newLineNum++;
      return item;
    });
  }, [activeDiff]);

  // Recursive tree renderer
  const renderTreeNodes = (nodes: FileTreeItem[], depth = 0) => {
    return nodes.map((node) => {
      if (node.isFolder) {
        const isCollapsed = Boolean(collapsedFolders[node.fullPath]);
        return (
          <div key={node.fullPath} className="flex flex-col">
            <button
              type="button"
              onClick={() => toggleFolder(node.fullPath)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer w-full text-left"
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              {isCollapsed ? (
                <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              ) : (
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              )}
              <span className="font-semibold text-slate-200">{node.name}</span>
            </button>
            {!isCollapsed && node.children && (
              <div className="flex flex-col">
                {renderTreeNodes(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      // File Node
      const isSelected = activeFilePath === node.fullPath;
      const hasViolation = node.diff?.isScopeViolation;

      return (
        <button
          key={node.fullPath}
          type="button"
          onClick={() => {
            onSelectFilePath(node.fullPath);
            // Switch branch to match author if available
            if (node.authorPersona === 'backend' && pullRequests['feat/backend-worker']) {
              onSelectBranch('feat/backend-worker');
            } else if (node.authorPersona === 'frontend' && pullRequests['feat/frontend-worker']) {
              onSelectBranch('feat/frontend-worker');
            } else if (node.authorPersona === 'qa' && pullRequests['test/qa-conformance']) {
              onSelectBranch('test/qa-conformance');
            }
          }}
          className={`group flex items-center justify-between gap-1.5 px-2 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer text-left ${
            isSelected
              ? 'bg-indigo-950/80 text-white font-semibold border border-indigo-600/70 shadow-xs'
              : hasViolation
              ? 'bg-rose-950/30 text-rose-300 border border-rose-800/40 hover:bg-rose-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
          style={{ paddingLeft: `${depth * 14 + 18}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <FileCode
              className={`w-3.5 h-3.5 shrink-0 ${
                hasViolation
                  ? 'text-rose-400'
                  : isSelected
                  ? 'text-indigo-400'
                  : node.name.endsWith('.tsx')
                  ? 'text-sky-400'
                  : node.name.endsWith('.json')
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            />
            <span className="truncate">{node.name}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] shrink-0 font-mono">
            {node.authorPersona && (
              <span
                className={`px-1 py-0.2 rounded text-[9px] uppercase font-bold ${
                  node.authorPersona === 'backend'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                    : node.authorPersona === 'frontend'
                    ? 'bg-sky-950 text-sky-400 border border-sky-800/40'
                    : node.authorPersona === 'qa'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                    : 'bg-indigo-950 text-indigo-400 border border-indigo-800/40'
                }`}
              >
                {node.authorPersona.slice(0, 4)}
              </span>
            )}
            {node.diff && (
              <span className="text-emerald-400">+{node.diff.additions}</span>
            )}
          </div>
        </button>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-text">
      {/* Scope Violation Warning Alert Strip */}
      {hasScopeViolations && (
        <div className="px-4 py-2 bg-rose-950/70 border-b border-rose-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-rose-300 min-w-0">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold shrink-0">
              Automated Scope Violation Detected:
            </span>
            <span className="font-mono text-[11px] text-rose-200 truncate">
              {currentPr?.scopeViolations?.[0]?.reason || 'File modified outside permitted worker scope'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onApplyFix && (
              <button
                type="button"
                onClick={onApplyFix}
                disabled={isAgentFixing}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm shadow-amber-950 transition-all animate-pulse cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAgentFixing ? 'animate-spin' : ''}`} />
                <span>{isAgentFixing ? 'Applying 1-Click Repair...' : '⚠️ 1-Click Auto-Repair Feature'}</span>
              </button>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-700/60 shrink-0">
              MERGE BLOCKED
            </span>
          </div>
        </div>
      )}

      {/* Top Header: Mode Switcher (File Explorer vs Git Diffs) & Branch Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        {/* Left: Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveViewerMode('files')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeViewerMode === 'files'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-indigo-300" />
            <span>📁 File Explorer</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60">
              {allWorkerFiles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewerMode('diffs')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeViewerMode === 'diffs'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5 text-purple-300" />
            <span>🔀 Git Diffs & PRs</span>
            {currentPr && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700/60">
                {currentPr.diffs.length}
              </span>
            )}
          </button>
        </div>

        {/* Center / Right: Branch Tabs or Diff Mode View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Branch Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <GitBranch className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <div className="flex items-center gap-1">
              {branches.map((b) => {
                const pr = pullRequests[b];
                const isSelected = selectedBranch === b;
                const prHasViolation = pr?.diffs.some((d) => d.isScopeViolation);

                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onSelectBranch(b)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/80 text-indigo-200 border-indigo-600/70 font-semibold shadow-xs'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{pr?.id || b.split('/')[1] || b}</span>
                    {prHasViolation ? (
                      <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                    ) : pr?.ciStatus === 'success' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : pr?.ciStatus === 'failure' ? (
                      <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diff Mode Toggle (Unified vs Split) if in Diffs view */}
          {activeViewerMode === 'diffs' && (
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => onChangeDiffViewMode('unified')}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                  diffViewMode === 'unified'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlignJustify className="w-3 h-3" />
                <span>Unified</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeDiffViewMode('split')}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                  diffViewMode === 'split'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Split className="w-3 h-3" />
                <span>Split</span>
              </button>
            </div>
          )}

          {/* Test Scope Violation Toggle Button */}
          {onToggleScopeViolation && (
            <button
              type="button"
              onClick={onToggleScopeViolation}
              title="Test automated file scope guard detection"
              className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                hasScopeViolations
                  ? 'bg-rose-950/70 text-rose-300 border-rose-800 hover:bg-rose-900'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {hasScopeViolations ? 'Reset Scope Guard' : 'Test Scope Violation'}
            </button>
          )}
        </div>
      </div>

      {/* Main Split Body: Left File Tree Sidebar + Right Code Viewer */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Sidebar: File Tree & Worker Filter */}
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0 overflow-hidden">
          {/* Quick Search Input */}
          <div className="p-2 border-b border-slate-800 bg-slate-900/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Persona Filter Pills */}
            <div className="flex items-center gap-1 mt-2 overflow-x-auto no-scrollbar text-[10px]">
              <button
                type="button"
                onClick={() => setFilterPersona('all')}
                className={`px-2 py-0.5 rounded-md font-mono transition-colors cursor-pointer ${
                  filterPersona === 'all'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                All ({allWorkerFiles.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterPersona('backend')}
                className={`px-2 py-0.5 rounded-md font-mono transition-colors cursor-pointer ${
                  filterPersona === 'backend'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Backend
              </button>
              <button
                type="button"
                onClick={() => setFilterPersona('frontend')}
                className={`px-2 py-0.5 rounded-md font-mono transition-colors cursor-pointer ${
                  filterPersona === 'frontend'
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Frontend
              </button>
              <button
                type="button"
                onClick={() => setFilterPersona('qa')}
                className={`px-2 py-0.5 rounded-md font-mono transition-colors cursor-pointer ${
                  filterPersona === 'qa'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                QA
              </button>
            </div>
          </div>

          {/* Interactive File Tree Scroll Container */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5 select-none">
            {fileTree.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                No matching files found.
              </div>
            ) : (
              renderTreeNodes(fileTree)
            )}
          </div>

          {/* Bottom Agent Shortcut Drawer Link */}
          {onInspectWorker && (
            <div className="p-2 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-mono">Direct Inspect:</span>
              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={() => onInspectWorker('backend')}
                  className="px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/40 cursor-pointer"
                  title="Inspect Marcus Blake source code"
                >
                  Marcus
                </button>
                <button
                  type="button"
                  onClick={() => onInspectWorker('frontend')}
                  className="px-1.5 py-0.5 rounded bg-sky-950/70 text-sky-300 hover:bg-sky-900 border border-sky-800/40 cursor-pointer"
                  title="Inspect Sarah Chen source code"
                >
                  Sarah
                </button>
                <button
                  type="button"
                  onClick={() => onInspectWorker('qa')}
                  className="px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 hover:bg-amber-900 border border-amber-800/40 cursor-pointer"
                  title="Inspect Elena Rostova source code"
                >
                  Elena
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Code Viewer (File Explorer OR Git Diffs) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
          {/* File Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-900/70 border-b border-slate-800 text-xs shrink-0">
            {/* Left: Breadcrumbs & Author Info */}
            <div className="flex items-center gap-2 truncate min-w-0">
              <span className="text-slate-500 font-mono text-[11px]">FILE:</span>
              <span className="font-mono font-semibold text-slate-200 truncate">
                {activeFilePath}
              </span>

              {activeSourceFile.authorPersona && (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  <User className="w-2.5 h-2.5 text-indigo-400" />
                  <span>Author: {getPersonaName(activeSourceFile.authorPersona as any)}</span>
                </span>
              )}

              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40 hidden sm:inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Scope Compliant</span>
              </span>
            </div>

            {/* Right: Actions (Copy, Download, Stats) */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                {activeSourceFile.lines} lines · {activeSourceFile.size}
              </span>

              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                title="Copy code"
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
                onClick={handleDownloadCode}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main Code Viewport */}
          <div className="flex-1 overflow-auto bg-slate-950 flex flex-col">
            {activeViewerMode === 'files' ? (
              /* ================= 1. FULL FILE EXPLORER VIEW ================= */
              <div className="flex-1 p-3">
                <SyntaxHighlighter
                  code={activeSourceFile.content}
                  language={
                    activeFilePath.endsWith('.tsx')
                      ? 'tsx'
                      : activeFilePath.endsWith('.json')
                      ? 'json'
                      : 'typescript'
                  }
                  showLineNumbers={true}
                />
              </div>
            ) : (
              /* ================= 2. GIT DIFFS & PR VIEW ================= */
              <div className="flex-1 font-mono text-xs leading-relaxed">
                {activeDiff ? (
                  diffViewMode === 'unified' ? (
                    /* Unified Diff View */
                    <div className="min-w-full">
                      {parsedDiffLines.map((line, idx) => {
                        if (line.type === 'chunk') {
                          return (
                            <div
                              key={idx}
                              className="py-1 px-4 bg-slate-900/90 text-indigo-300 font-semibold border-y border-slate-800/80 text-[11px]"
                            >
                              {line.text}
                            </div>
                          );
                        }

                        const isAddition = line.type === 'addition';
                        const isDeletion = line.type === 'deletion';

                        return (
                          <div
                            key={idx}
                            className={`flex items-start hover:bg-slate-900/40 ${
                              isAddition
                                ? 'bg-emerald-950/35 text-emerald-200'
                                : isDeletion
                                ? 'bg-rose-950/35 text-rose-200'
                                : 'text-slate-300'
                            }`}
                          >
                            <span className="w-10 px-2 py-0.5 text-right text-slate-600 select-none shrink-0 border-r border-slate-900 text-[11px]">
                              {line.oldNum || ''}
                            </span>
                            <span className="w-10 px-2 py-0.5 text-right text-slate-600 select-none shrink-0 border-r border-slate-900 text-[11px]">
                              {line.newNum || ''}
                            </span>
                            <span
                              className={`w-5 text-center select-none shrink-0 py-0.5 ${
                                isAddition
                                  ? 'text-emerald-400 font-bold'
                                  : isDeletion
                                  ? 'text-rose-400 font-bold'
                                  : 'text-slate-600'
                              }`}
                            >
                              {isAddition ? '+' : isDeletion ? '-' : ' '}
                            </span>
                            <pre className="flex-1 py-0.5 pr-4 whitespace-pre overflow-x-auto text-[12px]">
                              {line.text}
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Split Diff View */
                    <div className="min-w-full divide-y divide-slate-900">
                      {parsedDiffLines.map((line, idx) => {
                        if (line.type === 'chunk') {
                          return (
                            <div
                              key={idx}
                              className="py-1 px-4 bg-slate-900/90 text-indigo-300 font-semibold border-y border-slate-800/80 text-[11px]"
                            >
                              {line.text}
                            </div>
                          );
                        }

                        const isAddition = line.type === 'addition';
                        const isDeletion = line.type === 'deletion';

                        return (
                          <div key={idx} className="grid grid-cols-2 text-[12px] divide-x divide-slate-900">
                            <div
                              className={`flex items-start ${
                                isDeletion
                                  ? 'bg-rose-950/35 text-rose-200'
                                  : isAddition
                                  ? 'bg-slate-950/40 text-transparent select-none'
                                  : 'text-slate-300'
                              }`}
                            >
                              <span className="w-10 px-2 py-0.5 text-right text-slate-600 select-none shrink-0 border-r border-slate-900 text-[11px]">
                                {line.oldNum || ''}
                              </span>
                              <span className="w-5 text-center select-none shrink-0 py-0.5 text-rose-400 font-bold">
                                {isDeletion ? '-' : ''}
                              </span>
                              <pre className="flex-1 py-0.5 pr-2 whitespace-pre overflow-x-auto">
                                {isAddition ? ' ' : line.text}
                              </pre>
                            </div>

                            <div
                              className={`flex items-start ${
                                isAddition
                                  ? 'bg-emerald-950/35 text-emerald-200'
                                  : isDeletion
                                  ? 'bg-slate-950/40 text-transparent select-none'
                                  : 'text-slate-300'
                              }`}
                            >
                              <span className="w-10 px-2 py-0.5 text-right text-slate-600 select-none shrink-0 border-r border-slate-900 text-[11px]">
                                {line.newNum || ''}
                              </span>
                              <span className="w-5 text-center select-none shrink-0 py-0.5 text-emerald-400 font-bold">
                                {isAddition ? '+' : ''}
                              </span>
                              <pre className="flex-1 py-0.5 pr-2 whitespace-pre overflow-x-auto">
                                {isDeletion ? ' ' : line.text}
                              </pre>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="p-8 text-center text-slate-500 font-mono">
                    No pull request diffs registered on branch {selectedBranch}.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
