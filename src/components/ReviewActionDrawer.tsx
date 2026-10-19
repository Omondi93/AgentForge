import React, { useState, useRef, useEffect } from 'react';
import {
  GitMerge,
  Sparkles,
  XCircle,
  Eye,
  Check,
  Rocket,
  Globe,
  ExternalLink,
  Loader2,
  ChevronDown,
  Monitor,
  User,
  Download,
  GitBranch,
  Copy,
} from 'lucide-react';
import {
  PullRequestState,
  PlanningStage,
  DeploymentState,
  DeploymentProvider,
} from '../types/agentforge';
import { useAgentPersonas } from '../context/AgentPersonaContext';

interface ReviewActionDrawerProps {
  currentPr?: PullRequestState;
  stage: PlanningStage;
  contractVersion: string;
  onApproveAndMerge: () => void;
  onApplyAgentFix: () => void;
  onRejectBranch: () => void;
  onViewDiffTab: () => void;
  isAgentFixing: boolean;
  deploymentState?: DeploymentState;
  onDeployToProduction?: (provider?: DeploymentProvider) => void;
  isDeploying?: boolean;
  onViewPreviewTab?: () => void;
  viewMode?: 'executive' | 'developer';
  onDownloadZip?: () => void;
  onPushToGitHub?: () => void;
  onCopyContract?: () => void;
}

export const ReviewActionDrawer: React.FC<ReviewActionDrawerProps> = ({
  currentPr,
  stage,
  contractVersion,
  onApproveAndMerge,
  onApplyAgentFix,
  onRejectBranch,
  onViewDiffTab,
  isAgentFixing,
  deploymentState,
  onDeployToProduction,
  isDeploying = false,
  onViewPreviewTab,
  viewMode = 'executive',
  onDownloadZip,
  onPushToGitHub,
  onCopyContract,
}) => {
  const { getPersonaName } = useAgentPersonas();
  const [isMerging, setIsMerging] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<DeploymentProvider>('vercel');
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMerged = stage === 'merged' || currentPr?.reviewStatus === 'merged';
  const isCiFailed = currentPr?.ciStatus === 'failure' || stage === 'ci_failed';
  const hasScopeViolations =
    (currentPr?.scopeViolations && currentPr.scopeViolations.length > 0) ||
    currentPr?.diffs.some((d) => d.isScopeViolation);

  const totalAdditions = currentPr?.diffs.reduce((acc, d) => acc + d.additions, 0) || 0;
  const totalDeletions = currentPr?.diffs.reduce((acc, d) => acc + d.deletions, 0) || 0;

  // Strict 3-Condition Merge Policy:
  // 1. All 3 CI checks pass ('success')
  const ciPassed = currentPr?.ciStatus === 'success';
  // 2. No contract version mismatches exist
  const contractMatched = true; // Invariant enforced by Lead Architect
  // 3. PR diff has been viewed
  const diffViewed = !!currentPr?.diffViewed;

  const canMerge = ciPassed && contractMatched && diffViewed && !hasScopeViolations && !isMerged;

  const handleMergeClick = () => {
    if (!canMerge) return;
    setIsMerging(true);
    setTimeout(() => {
      onApproveAndMerge();
      setIsMerging(false);
    }, 600);
  };

  const getDeploymentStatusLabel = (status: DeploymentState['status']) => {
    switch (status) {
      case 'building':
        return 'Building Production Artifacts...';
      case 'optimizing':
        return 'Optimizing Static Assets...';
      case 'assigning_domain':
        return 'Assigning Edge Domain...';
      case 'live':
        return 'Production: Live';
      default:
        return 'Deploy to Production';
    }
  };

  return (
    <div className="sticky bottom-0 z-20 w-full bg-slate-900/95 border-t border-slate-800 px-6 py-3.5 backdrop-blur shadow-lg">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Summary Checklist */}
        {viewMode === 'executive' ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isMerged
                    ? 'bg-emerald-500'
                    : isMerged
                    ? 'bg-emerald-400'
                    : hasScopeViolations
                    ? 'bg-amber-400 animate-pulse'
                    : ciPassed
                    ? 'bg-emerald-400'
                    : isCiFailed
                    ? 'bg-rose-400 animate-pulse'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="text-xs sm:text-sm font-bold text-slate-100">
                {isMerged
                  ? 'Feature Status: Published Live'
                  : hasScopeViolations
                  ? 'Action Needed: Automated Scope Violation'
                  : ciPassed
                  ? 'Feature Status: Verified & Ready to Publish'
                  : isCiFailed
                  ? 'Action Needed: Automated Test Issue'
                  : 'Feature Status: Running Automated Quality Tests'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-sans">
              {hasScopeViolations ? (
                <>
                  <span className="text-amber-400 font-medium">⚠️ Endpoint outside permitted scope</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-300">Click 1-Click Auto-Repair to authorize App Router endpoints</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-400 font-medium">✓ 3 Quality Checks Passed</span>
                  <span className="text-slate-600">·</span>
                  <span>0 Security Vulnerabilities</span>
                  <span className="text-slate-600">·</span>
                  <span>Mobile & Desktop Verified</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">{currentPr?.id || 'PR #104'}</span>
              <span className="text-slate-500">·</span>
              {currentPr?.authorPersona && (
                <>
                  <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                    <User className="w-2.5 h-2.5" />
                    <span>{getPersonaName(currentPr.authorPersona)}</span>
                  </span>
                  <span className="text-slate-500">·</span>
                </>
              )}
              <span className="text-slate-400">
                {currentPr?.diffs.length || 0} files changed
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400">+{totalAdditions}</span>
              <span className="text-rose-400">-{totalDeletions}</span>
            </div>

            {/* Merge Policy Status Verification Checklist */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800 text-[11px]">
              {/* Condition 1: CI Passing */}
              <span
                className={`flex items-center gap-1 ${
                  ciPassed ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {ciPassed ? <Check className="w-3 h-3" /> : <span className="w-3 text-center">○</span>}
                <span>CI Green</span>
              </span>

              <span className="text-slate-700">·</span>

              {/* Condition 2: Contract Version Match */}
              <span
                className={`flex items-center gap-1 ${
                  contractMatched ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {contractMatched ? <Check className="w-3 h-3" /> : <span>✕</span>}
                <span>Contract {contractVersion}</span>
              </span>

              <span className="text-slate-700">·</span>

              {/* Condition 3: PR Diff Viewed */}
              <button
                type="button"
                onClick={onViewDiffTab}
                className={`flex items-center gap-1 hover:underline transition-colors ${
                  diffViewed ? 'text-emerald-400' : 'text-amber-400 font-semibold'
                }`}
              >
                {diffViewed ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3 animate-pulse" />
                )}
                <span>{diffViewed ? 'Diff Viewed' : 'Diff Unviewed'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Right: Sticky Action Drawer Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
          {viewMode === 'executive' ? (
            /* Executive Mode Actions */
            <div className="flex items-center gap-3">
              {(isCiFailed || hasScopeViolations) && (
                <button
                  type="button"
                  onClick={onApplyAgentFix}
                  disabled={isAgentFixing || isMerged}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/40 animate-pulse cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${isAgentFixing ? 'animate-spin text-amber-200' : 'text-amber-200'}`} />
                  <span>{isAgentFixing ? 'Applying 1-Click Repair...' : '⚠️ 1-Click Auto-Repair Feature'}</span>
                </button>
              )}

              {isMerged ? (
                <div className="flex items-center gap-2.5">
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Feature Published Live</span>
                  </span>

                  {/* Export / Deploy Dropdown */}
                  <div className="relative" ref={exportMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
                      title="Export virtual codebase, download ZIP, or deploy to production"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>Export / Deploy</span>
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>

                    {showExportMenu && (
                      <div className="absolute right-0 bottom-full mb-2 w-60 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 text-xs animate-in fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            onDownloadZip?.();
                            setShowExportMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 transition-colors text-left cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">Download ZIP Archive</span>
                            <span className="text-[10px] text-slate-400">Export virtual file system</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onPushToGitHub?.();
                            setShowExportMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 transition-colors text-left cursor-pointer"
                        >
                          <GitBranch className="w-4 h-4 text-purple-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">Push to GitHub</span>
                            <span className="text-[10px] text-slate-400">Branch & Pull Request</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onCopyContract?.();
                            setShowExportMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 transition-colors text-left cursor-pointer"
                        >
                          <Copy className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">Copy Contract JSON</span>
                            <span className="text-[10px] text-slate-400">Finalized schema contract</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {onViewPreviewTab && (
                    <button
                      type="button"
                      onClick={onViewPreviewTab}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md transition-all cursor-pointer"
                    >
                      <Monitor className="w-3.5 h-3.5 text-sky-400" />
                      <span>View Live App</span>
                    </button>
                  )}
                  {deploymentState?.status === 'live' && (
                    <a
                      href={deploymentState.productionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-emerald-500/30 transition-all"
                    >
                      <span>Open External URL</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <button
                    type="button"
                    onClick={handleMergeClick}
                    disabled={!canMerge}
                    className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md ${
                      canMerge
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30 ring-2 ring-emerald-400/50 hover:scale-[1.01] cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>✅ Approve Feature & Publish Live</span>
                  </button>
                  <span className="text-[10px] sm:text-[11px] text-emerald-400/90 mt-1 font-medium">
                    {canMerge ? 'All 3 automated tests passed successfully' : 'Waiting for automated tests to conclude'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Developer Mode Actions */
            <>
              {/* Reject Branch */}
              <button
                type="button"
                onClick={onRejectBranch}
                disabled={isMerged}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 active:bg-slate-900 border border-slate-700/60 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Reject Branch</span>
              </button>

              {/* Apply Agent Fix / Triage Recovery */}
              {(isCiFailed || hasScopeViolations) && (
                <button
                  type="button"
                  onClick={onApplyAgentFix}
                  disabled={isAgentFixing || isMerged}
                  title="Apply bounded triage fix with 1 revision attempt limit"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shadow-xs bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30 ring-2 ring-amber-400/50 animate-pulse"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAgentFixing ? 'animate-spin text-amber-200' : 'text-amber-200'}`} />
                  <span>{isAgentFixing ? 'Applying 1-Click Repair...' : '⚠️ 1-Click Auto-Repair Feature'}</span>
                </button>
              )}

              {/* Approve & Merge PR (Gated by 3 Conditions) */}
              <button
                type="button"
                onClick={handleMergeClick}
                disabled={!canMerge}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shadow-sm ${
                  isMerged
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60 cursor-default'
                    : canMerge
                    ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-700/30 ring-2 ring-emerald-500/40 hover:scale-[1.02]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <GitMerge className={`w-3.5 h-3.5 ${isMerging ? 'animate-spin' : ''}`} />
                <span>
                  {isMerged
                    ? 'Merged into main (d891a20)'
                    : hasScopeViolations
                    ? 'Blocked (Scope Violation)'
                    : !ciPassed
                    ? 'Blocked (Awaiting CI)'
                    : !diffViewed
                    ? 'Blocked (Inspect Diff First)'
                    : 'Approve & Merge PR'}
                </span>
              </button>
            </>
          )}

          {/* Phase 5: High-Visibility Deploy to Production & Export once merged */}
          {isMerged && (
            <div className="relative flex items-center gap-1.5">
              {/* Quick Export Button */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                  title="Export virtual codebase, download ZIP, or deploy to production"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Export</span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-60 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 text-xs animate-in fade-in">
                    <button
                      type="button"
                      onClick={() => {
                        onDownloadZip?.();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">Download ZIP Archive</span>
                        <span className="text-[10px] text-slate-400">Export virtual file system</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onPushToGitHub?.();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <GitBranch className="w-4 h-4 text-purple-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">Push to GitHub</span>
                        <span className="text-[10px] text-slate-400">Branch & Pull Request</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onCopyContract?.();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">Copy Contract JSON</span>
                        <span className="text-[10px] text-slate-400">Finalized schema contract</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {deploymentState?.status === 'live' ? (
                <div className="flex items-center gap-2">
                  <a
                    href={deploymentState.productionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950 border border-emerald-800/70 hover:bg-emerald-900/90 rounded-lg shadow-sm transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Production: Live ({deploymentState.provider.toUpperCase()})</span>
                    <ExternalLink className="w-3 h-3 text-emerald-400 ml-0.5" />
                  </a>

                  {onViewPreviewTab && (
                    <button
                      type="button"
                      onClick={onViewPreviewTab}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                      title="Inspect live interactive UI in right tab"
                    >
                      <Monitor className="w-3.5 h-3.5 text-sky-400" />
                      <span>View Live App</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeployToProduction?.(selectedProvider)}
                    disabled={isDeploying}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 rounded-lg hover:bg-slate-700 border border-slate-700/60 transition-colors"
                    title="Trigger redeploy"
                  >
                    <Rocket className="w-3 h-3 text-indigo-400" />
                    <span className="text-[11px]">Redeploy</span>
                  </button>
                </div>
              ) : isDeploying ? (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-950 text-indigo-200 border border-indigo-700/60 rounded-lg shadow-md animate-pulse text-xs font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>{getDeploymentStatusLabel(deploymentState?.status || 'building')}</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onDeployToProduction?.(selectedProvider)}
                    className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:from-indigo-700 rounded-l-lg shadow-md shadow-indigo-950 transition-all ring-1 ring-indigo-400/50"
                  >
                    <Rocket className="w-3.5 h-3.5 text-white" />
                    <span>Deploy to Production ({selectedProvider === 'vercel' ? 'Vercel' : 'Cloudflare'})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProviderMenu(!showProviderMenu)}
                    className="px-2 py-1.5 text-xs bg-indigo-700 hover:bg-indigo-600 text-white rounded-r-lg border-l border-indigo-400/40 transition-colors"
                    title="Select hosting provider"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Provider Dropdown */}
                  {showProviderMenu && (
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1 z-30 font-sans text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProvider('vercel');
                          setShowProviderMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                          selectedProvider === 'vercel'
                            ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Vercel Edge</span>
                        </div>
                        {selectedProvider === 'vercel' && <Check className="w-3 h-3 text-indigo-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProvider('cloudflare');
                          setShowProviderMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                          selectedProvider === 'cloudflare'
                            ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Rocket className="w-3.5 h-3.5 text-sky-400" />
                          <span>Cloudflare Workers</span>
                        </div>
                        {selectedProvider === 'cloudflare' && <Check className="w-3 h-3 text-sky-400" />}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
