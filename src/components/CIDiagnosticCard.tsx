import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  Check,
  X,
  FileCode,
  ShieldAlert,
  ArrowRight,
  Terminal,
  RotateCcw,
} from 'lucide-react';
import { CIDiagnostic } from '../types/agentforge';

interface CIDiagnosticCardProps {
  diagnostic: CIDiagnostic;
  onApproveFix: () => void;
  onManualOverride: (overrideNote: string) => void;
  isApplying: boolean;
}

export const CIDiagnosticCard: React.FC<CIDiagnosticCardProps> = ({
  diagnostic,
  onApproveFix,
  onManualOverride,
  isApplying,
}) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const [overrideText, setOverrideText] = useState('');
  const [showRawError, setShowRawError] = useState(false);

  const hasExceededAttempts = diagnostic.revisionAttemptsUsed >= diagnostic.maxRevisionAttempts;
  const isApplied = diagnostic.status === 'approved_and_applied';

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (overrideText.trim()) {
      onManualOverride(overrideText.trim());
      setShowManualInput(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 border border-amber-800/60 rounded-xl flex flex-col gap-3.5 shadow-md">
      {/* Header with Lead Architect Badge and Confidence Score */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Lead Architect Automated Triage
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Bounded Recovery Engine (Zero Infinite Loops)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
            Confidence: {diagnostic.confidenceScore}%
          </span>
          <span
            className={`px-2 py-0.5 rounded border ${
              hasExceededAttempts
                ? 'bg-rose-950/60 text-rose-300 border-rose-800/50'
                : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50'
            }`}
          >
            Attempt: {diagnostic.revisionAttemptsUsed}/{diagnostic.maxRevisionAttempts} Max
          </span>
        </div>
      </div>

      {/* Root Cause Analysis */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Root Cause Analysis ({diagnostic.failedStep}):</span>
        </div>
        <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono leading-relaxed">
          {diagnostic.rootCause}
        </p>
      </div>

      {/* Raw Error Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowRawError(!showRawError)}
          className="text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
        >
          <Terminal className="w-3 h-3 text-slate-500" />
          <span>{showRawError ? 'Hide Raw Stack Trace' : 'View Ingested Raw Stack Trace'}</span>
        </button>
        {showRawError && (
          <pre className="mt-1.5 p-2 bg-slate-950 rounded text-[11px] font-mono text-rose-300 border border-slate-800 overflow-x-auto">
            {diagnostic.rawError}
          </pre>
        )}
      </div>

      {/* Concrete Proposed Fix Preview */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
          <div className="flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>Proposed Concrete Fix:</span>
          </div>
          <code className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/30">
            {diagnostic.proposedFix.filePath}
          </code>
        </div>
        <p className="text-[11px] text-slate-400">{diagnostic.proposedFix.description}</p>
        <pre className="p-2.5 bg-slate-950 text-emerald-300 font-mono text-[11px] rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
          {diagnostic.proposedFix.patch}
        </pre>
      </div>

      {/* Guardrail Notice */}
      <div className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong>Guardrail Active:</strong> Worker agents cannot commit fixes without explicit human sign-off. Strict limit of 1 automated revision attempt per CI failure cycle.
        </span>
      </div>

      {/* Action Buttons: Approve Suggested Fix vs Manual Override */}
      {!isApplied ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="w-full sm:w-auto px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
          >
            {showManualInput ? 'Cancel Override' : 'Reject & Provide Manual Override'}
          </button>

          <button
            type="button"
            onClick={onApproveFix}
            disabled={hasExceededAttempts || isApplying}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all whitespace-nowrap ${
              hasExceededAttempts
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30 ring-2 ring-amber-500/40'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
            <span>
              {hasExceededAttempts
                ? 'Max Revisions Exceeded (Manual Override Required)'
                : isApplying
                ? 'Applying Triage Revision...'
                : 'Approve Suggested Fix (1 revision attempt)'}
            </span>
          </button>
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-950/50 border border-emerald-800/60 rounded-lg flex items-center justify-between text-xs text-emerald-300 font-mono">
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Fix Approved & Applied to Branch. CI Re-run Green.</span>
          </div>
          <span className="text-[10px] text-emerald-400">c891a04</span>
        </div>
      )}

      {/* Manual Override Input Form */}
      {showManualInput && !isApplied && (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg mt-1">
          <label className="text-[11px] font-semibold text-slate-300">
            Manual Override Specification / Commit Directive:
          </label>
          <textarea
            value={overrideText}
            onChange={(e) => setOverrideText(e.target.value)}
            rows={2}
            placeholder="e.g., Cast user roles to ('admin' | 'member' | 'viewer')[] with strict empty fallback, discard external payload."
            className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-indigo-500 resize-none"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowManualInput(false)}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors"
            >
              Apply Manual Override
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
