import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { CIStepLog, PullRequestState } from '../types/agentforge';
import { CIDiagnosticCard } from './CIDiagnosticCard';

interface CIPipelineChecksProps {
  currentPr?: PullRequestState;
  onApplyFix?: () => void;
  onManualOverride?: (note: string) => void;
  isAgentFixing?: boolean;
}

export const CIPipelineChecks: React.FC<CIPipelineChecksProps> = ({
  currentPr,
  onApplyFix,
  onManualOverride,
  isAgentFixing,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    'step-1': true,
    'step-2': true,
    'step-3': true,
  });

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const steps = currentPr?.ciLogs || [];
  const hasFailure = currentPr?.ciStatus === 'failure' || steps.some((s) => s.status === 'failure');

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto p-4 gap-4">
      {/* CI Overview Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              hasFailure
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {hasFailure ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">
                GitHub Actions: Workflow #{currentPr?.id || 'PR-104'}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  hasFailure
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                }`}
              >
                {hasFailure ? 'Checks Failed' : 'All Checks Passed'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono mt-0.5">
              Target Branch: <span className="text-slate-300">{currentPr?.branch || 'main'}</span> (SHA{' '}
              {currentPr?.headSha.substring(0, 7) || 'HEAD'})
            </span>
          </div>
        </div>

        {/* Human-in-the-loop quick action on failure */}
        {hasFailure && onApplyFix && !currentPr?.diagnostic && (
          <button
            type="button"
            onClick={onApplyFix}
            disabled={isAgentFixing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 rounded-lg shadow-sm shadow-rose-900/30 transition-all whitespace-nowrap"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAgentFixing ? 'animate-spin' : ''}`} />
            <span>{isAgentFixing ? 'Repairing Branch...' : 'Trigger Lead Triage'}</span>
          </button>
        )}
      </div>

      {/* Structured Lead Agent Triage Card (Phase 4 Human-in-the-Loop Recovery) */}
      {currentPr?.diagnostic && hasFailure && (
        <CIDiagnosticCard
          diagnostic={currentPr.diagnostic}
          onApproveFix={onApplyFix || (() => {})}
          onManualOverride={onManualOverride || (() => {})}
          isApplying={!!isAgentFixing}
        />
      )}

      {/* Step Breakdown Cards */}
      <div className="flex flex-col gap-3">
        {steps.map((step) => {
          const isSuccess = step.status === 'success';
          const isFailed = step.status === 'failure';
          const isRunning = step.status === 'running';
          const isExpanded = !!expandedSteps[step.id];

          return (
            <div
              key={step.id}
              className={`rounded-xl border overflow-hidden transition-all ${
                isFailed
                  ? 'bg-slate-900/80 border-rose-800/60'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              {/* Step Header */}
              <button
                type="button"
                onClick={() => toggleStep(step.id)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {isFailed ? (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isRunning ? (
                      <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{step.name}</span>
                      <code className="text-[11px] font-mono text-indigo-300 bg-indigo-950/50 px-1.5 py-0.2 rounded border border-indigo-800/30">
                        {step.command}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {step.durationMs > 0 && (
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                      {(step.durationMs / 1000).toFixed(2)}s
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expandable Step Logs Console */}
              {isExpanded && (
                <div className="p-3 bg-slate-950 border-t border-slate-800/80 font-mono text-xs text-slate-300 flex flex-col gap-1 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-slate-500 pb-1 border-b border-slate-900 text-[10px]">
                    <Terminal className="w-3 h-3 text-slate-600" />
                    <span>stdout / stderr</span>
                  </div>

                  <div className="pt-1 flex flex-col gap-0.5">
                    {step.logs.map((logLine, idx) => {
                      const isErrorLine =
                        logLine.includes('FAIL') ||
                        logLine.includes('error') ||
                        logLine.includes('Error');
                      const isSuccessLine =
                        logLine.includes('PASS') ||
                        logLine.includes('✔') ||
                        logLine.includes('passed');

                      return (
                        <div
                          key={idx}
                          className={`${
                            isErrorLine
                              ? 'text-rose-400 font-medium'
                              : isSuccessLine
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {logLine}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
