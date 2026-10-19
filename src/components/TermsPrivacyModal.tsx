import React from 'react';
import { X, ShieldAlert, CheckCircle2, Lock, FileText, AlertTriangle } from 'lucide-react';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in select-text">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Legal Terms & Privacy Guardrails
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                AI safety guidelines, code generation terms, and privacy boundaries
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          {/* Core Banner */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-bold">Important Warranty Disclaimer:</span> AgentForge uses artificial intelligence to generate code, interface contracts, and automated tests. Output is provided strictly as-is without warranties of any kind. You are responsible for auditing generated code before deploying to production environments.
            </div>
          </div>

          {/* Section 1: Code Auditing Responsibility */}
          <div className="space-y-1.5 pt-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>1. Human-in-the-Loop Verification</span>
            </h3>
            <p className="pl-5 text-slate-600 dark:text-slate-400">
              Every pull request produced by Backend Worker, Frontend Worker, or QA Engineer must pass Gate 3 Frozen Contract verification and be manually reviewed and approved by an authorized human reviewer prior to branch merging.
            </p>
          </div>

          {/* Section 2: Data Privacy & Credentials Isolation */}
          <div className="space-y-1.5 pt-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              <span>2. Credential Security & Zero Exfiltration</span>
            </h3>
            <p className="pl-5 text-slate-600 dark:text-slate-400">
              Personal Access Tokens (PATs) and AI provider API keys configured in AgentForge are kept in client-side memory or browser local storage. Never transmit production secrets, proprietary customer PII, or database credentials through agent chat prompts.
            </p>
          </div>

          {/* Section 3: Intellectual Property */}
          <div className="space-y-1.5 pt-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-500" />
              <span>3. Code Ownership & Intellectual Property</span>
            </h3>
            <p className="pl-5 text-slate-600 dark:text-slate-400">
              All code authored or orchestrated within your AgentForge projects belongs solely to you and your organization. AgentForge retains no proprietary claims or copyright over code generated in your private workspaces.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
