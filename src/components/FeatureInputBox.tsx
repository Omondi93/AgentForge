import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Layers,
  ShieldAlert,
  ArrowRight,
  Edit3,
  Check,
  MessageSquare,
  Bot,
} from 'lucide-react';
import {
  PlanningQuestion,
  PlanningStage,
  RequirementsBaseline,
  ArchitectChatMessage,
  ContractSchema,
} from '../types/agentforge';
import { LeadArchitectChat } from './LeadArchitectChat';

interface FeatureInputBoxProps {
  prompt?: string;
  onPromptChange?: (newPrompt: string) => void;
  onAnalyzePrompt?: (prompt: string) => void;
  isGeneratingQuestions?: boolean;
  simulateCiFailure: boolean;
  onToggleCiFailure: (val: boolean) => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  stage: PlanningStage;
  currentGate: 1 | 2 | 3 | 'completed';
  questions: PlanningQuestion[];
  onSelectOption: (questionId: string, optionId: string) => void;
  onCustomAnswer: (questionId: string, customText: string) => void;
  requirementsBaseline: RequirementsBaseline | null;
  onCompileBaseline: () => void;
  contractFrozen: boolean;
  onApproveAndFreezeContract: () => void;
  chatMessages: ArchitectChatMessage[];
  onSendChatMessage: (
    text: string,
    model?: string,
    agentRole?: string,
    enableGrounding?: boolean
  ) => void;
  isSendingChatMessage: boolean;
  onResetChat: () => void;
  contract: ContractSchema;
}

export const FeatureInputBox: React.FC<FeatureInputBoxProps> = ({
  simulateCiFailure,
  onToggleCiFailure,
  onRunSimulation,
  isSimulating,
  currentGate,
  questions,
  onSelectOption,
  onCustomAnswer,
  requirementsBaseline,
  onCompileBaseline,
  contractFrozen,
  onApproveAndFreezeContract,
  chatMessages,
  onSendChatMessage,
  isSendingChatMessage,
  onResetChat,
  contract,
}) => {
  const [showBaseline, setShowBaseline] = useState<boolean>(true);
  const [discoveryMode, setDiscoveryMode] = useState<'chat' | 'cards'>('chat');
  const [customInputOpen, setCustomInputOpen] = useState<Record<string, boolean>>({});

  const toggleCustomInput = (qId: string) => {
    setCustomInputOpen((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'mandatory':
        return 'text-rose-300 bg-rose-950/70 border-rose-700/50';
      case 'material':
        return 'text-indigo-300 bg-indigo-950/70 border-indigo-700/50';
      case 'low_impact':
      default:
        return 'text-slate-300 bg-slate-900 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-xl shadow-xs">
      {/* 1. Unified Architect Header & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Lead Architect Workspace
            </span>
            <span className="text-[10px] text-slate-400 font-mono ml-2">
              Gate {currentGate === 'completed' ? 'Cleared' : `${currentGate}/3`}
            </span>
          </div>
        </div>

        {/* View Mode Toggle: Interactive Chat vs Structured Decision Cards */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDiscoveryMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              discoveryMode === 'chat'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Architect Chat</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/40">
              {chatMessages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDiscoveryMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              discoveryMode === 'cards'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Decision Cards</span>
            {questions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {questions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Simulation Utility Bar (CI Failure Trigger & Lifecycle Execution) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 py-1 text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={simulateCiFailure}
            onChange={(e) => onToggleCiFailure(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500/30 focus:ring-offset-0 cursor-pointer accent-rose-500"
          />
          <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
            Simulate CI Failure (Test triage & auto-repair)
          </span>
        </label>

        <button
          type="button"
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Play className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Simulating...' : 'Full Lifecycle'}</span>
        </button>
      </div>

      {/* 3. Primary Workspace Area: Unified Architect Chat or Decision Cards */}
      {discoveryMode === 'chat' ? (
        <LeadArchitectChat
          messages={chatMessages}
          onSendMessage={onSendChatMessage}
          isSending={isSendingChatMessage}
          onResetChat={onResetChat}
          requirementsBaseline={requirementsBaseline}
          contract={contract}
          onApproveAndFreezeContract={onApproveAndFreezeContract}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {questions.length === 0 ? (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
              No questions generated yet. Send a feature request or select an architectural suggestion in Architect Chat to begin Gate 1 discovery.
            </div>
          ) : (
            questions.map((q) => {
              const isCustom = customInputOpen[q.id];
              return (
                <div
                  key={q.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col gap-2 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border self-start ${getCategoryBadge(
                        q.category
                      )}`}
                    >
                      {q.categoryLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {q.status === 'confirmed' ? '✓ Decision Selected' : 'Selection Required'}
                    </span>
                  </div>

                  <span className="text-xs font-medium text-slate-200">
                    {q.question}
                  </span>

                  {q.context && (
                    <p className="text-[11px] text-slate-400 font-sans leading-normal">
                      {q.context}
                    </p>
                  )}

                  <div className="flex flex-col gap-1.5 mt-1">
                    {q.options.map((opt) => {
                      const isSelected = q.selectedOptionId === opt.id && !q.isCustom;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onSelectOption(q.id, opt.id)}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-950/60 border-indigo-500/80 text-indigo-100 ring-1 ring-indigo-500/40'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'border-indigo-400 bg-indigo-600 text-white'
                                : 'border-slate-700 bg-slate-950'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium">{opt.label}</span>
                              {opt.isDefault && (
                                <span className="text-[9px] font-mono text-slate-500">
                                  (recommended)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {opt.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleCustomInput(q.id)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 self-start font-mono transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isCustom ? 'Hide custom answer' : 'Or enter custom architectural answer'}</span>
                    </button>

                    {isCustom && (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={q.customAnswer || ''}
                          onChange={(e) => onCustomAnswer(q.id, e.target.value)}
                          placeholder="Type custom architectural specification..."
                          className="flex-1 text-xs font-mono bg-slate-900 text-slate-200 border border-slate-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {questions.length > 0 && (
            <button
              type="button"
              onClick={onCompileBaseline}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm transition-all mt-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Compile Requirements Baseline & Decompose Tasks (Gate 1 & 2)</span>
            </button>
          )}
        </div>
      )}

      {/* 4. GATE 1 & 2 OUTPUT: Requirements Baseline Card (when compiled) */}
      {requirementsBaseline && (
        <div className="border-t border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={() => setShowBaseline(!showBaseline)}
            className="w-full flex items-center justify-between text-xs font-medium text-slate-300 hover:text-white transition-colors py-1 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">
                Requirements Baseline & Task Decomp (Gate 1 & 2 Cleared)
              </span>
            </div>
            {showBaseline ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {showBaseline && (
            <div className="flex flex-col gap-3 mt-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase text-slate-400 font-mono">
                  Functional Requirements:
                </span>
                <ul className="flex flex-col gap-1">
                  {requirementsBaseline.functionalRequirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-indigo-400 font-mono mt-0.5">·</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-900">
                <span className="text-[11px] font-semibold uppercase text-slate-400 font-mono">
                  Acceptance Criteria:
                </span>
                <ul className="flex flex-col gap-1">
                  {requirementsBaseline.acceptanceCriteria.map((crit, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-emerald-400 font-mono mt-0.5">✓</span>
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-900">
                <span className="text-[11px] font-semibold uppercase text-slate-400 font-mono">
                  Out-of-Scope Boundaries:
                </span>
                <ul className="flex flex-col gap-1">
                  {requirementsBaseline.outOfScope.map((scope, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-slate-600 font-mono mt-0.5">—</span>
                      <span>{scope}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {!contractFrozen && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Gate 3 Invariant: Contract draft awaiting your approval before workers code.</span>
                  </div>
                  <button
                    type="button"
                    onClick={onApproveAndFreezeContract}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-md transition-colors shrink-0 cursor-pointer"
                  >
                    <span>Approve & Freeze</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
