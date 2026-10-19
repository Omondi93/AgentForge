import React, { useState } from 'react';
import { GitBranch, Shield, Key, FolderGit2, X, Check, AlertCircle } from 'lucide-react';
import { GitConfig, GitEngineMode } from '../types/agentforge';

interface GitConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GitConfig;
  onSaveConfig: (newConfig: Partial<GitConfig>) => void;
}

export const GitConfigModal: React.FC<GitConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [mode, setMode] = useState<GitEngineMode>(config.mode);
  const [token, setToken] = useState<string>(config.githubToken || '');
  const [owner, setOwner] = useState<string>(config.repoOwner || '');
  const [repo, setRepo] = useState<string>(config.repoName || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      mode,
      githubToken: token,
      repoOwner: owner,
      repoName: repo,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FolderGit2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Dual-Mode Git Engine Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 text-xs font-sans">
          {/* Mode Selector */}
          <div className="flex flex-col gap-2">
            <label className="font-medium text-slate-300">Active Engine Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('virtual')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  mode === 'virtual'
                    ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Virtual Sandbox</span>
                  {mode === 'virtual' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <span className="text-[11px] text-slate-400 leading-normal">
                  In-memory deterministic Git store. Zero credentials required. Recommended.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('live_github')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  mode === 'live_github'
                    ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Live GitHub</span>
                  {mode === 'live_github' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <span className="text-[11px] text-slate-400 leading-normal">
                  Octokit REST API. Creates branches & PRs in remote GitHub repository.
                </span>
              </button>
            </div>
          </div>

          {/* GitHub Config Fields (if Live mode selected) */}
          {mode === 'live_github' ? (
            <div className="flex flex-col gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-1.5 text-indigo-300 font-mono text-[11px]">
                <Key className="w-3.5 h-3.5" />
                <span>GitHub Personal Access Token (PAT)</span>
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Repo Owner / Org</label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="my-org"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Repository Name</label>
                  <input
                    type="text"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="my-repo"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-slate-900/60 rounded text-[10px] text-slate-400">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>Token requires 'repo' scope. If unauthenticated or rate-limited, safely falls back to Virtual Sandbox.</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Virtual Sandbox is active. All SHAs, multi-file diffs, and pull requests are managed in memory.</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
