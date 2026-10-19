import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  CheckCircle2,
  FileCode2,
  Layers,
  Shield,
  Lightbulb,
  ArrowRight,
  Loader2,
  Globe,
  Cpu,
  BookmarkCheck,
  Zap,
} from 'lucide-react';
import {
  ArchitectChatMessage,
  RequirementsBaseline,
  ContractSchema,
} from '../types/agentforge';
import { useAgentPersonas } from '../context/AgentPersonaContext';
import { analyzeCrewRecommendation } from '../services/leadArchitectChatService';

interface LeadArchitectChatProps {
  messages: ArchitectChatMessage[];
  onSendMessage: (
    text: string,
    model?: string,
    agentRole?: string,
    enableGrounding?: boolean
  ) => void;
  isSending: boolean;
  onResetChat: () => void;
  requirementsBaseline: RequirementsBaseline | null;
  contract: ContractSchema;
  onApproveAndFreezeContract: () => void;
  onCompileBaseline?: () => void;
  isExpanded?: boolean;
}

export const LeadArchitectChat: React.FC<LeadArchitectChatProps> = ({
  messages,
  onSendMessage,
  isSending,
  onResetChat,
  requirementsBaseline,
  contract,
  onApproveAndFreezeContract,
  onCompileBaseline,
  isExpanded = false,
}) => {
  const { getPersonaName, getGlobalModelBadge, fleetState, applyCrewRecommendation } = useAgentPersonas();
  const [inputText, setInputText] = useState('');
  // Models: gemini-3.1-pro-preview (complex tasks), gemini-3.5-flash (general tasks), gemini-3.1-flash-lite (fast tasks)
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<string>('Lead Principal Software Architect');
  const [enableGrounding, setEnableGrounding] = useState<boolean>(true);
  const [appliedRecommendation, setAppliedRecommendation] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Compute recommended crew based on consultation context
  const recommendation = analyzeCrewRecommendation('', messages);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || isSending) return;
    onSendMessage(text, selectedModel, selectedRole, enableGrounding);
    if (!textToSend) {
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get active suggested reply chips from the most recent Lead message
  const lastLeadMessage = [...messages].reverse().find((m) => m.sender === 'lead');
  const activeSuggestedReplies = lastLeadMessage?.suggestedReplies || [
    'Why use HttpOnly cookies instead of Bearer headers?',
    'Can we add rate limiting to /api/v1/auth/login?',
    'What happens if a user submits invalid credentials?',
    'Freeze contract and begin worker coding',
  ];

  // Helper to format architectural response markdown-like text
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs text-slate-200 leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-semibold text-slate-100 text-xs mt-2 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-indigo-400 font-mono mt-0.5">•</span>
                <span>{line.substring(2)}</span>
              </div>
            );
          }
          if (line.match(/^\d+\.\s/)) {
            const num = line.match(/^\d+\./)?.[0];
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-indigo-400 font-mono font-semibold">{num}</span>
                <span>{line.replace(/^\d+\.\s/, '')}</span>
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
      {/* Consultation Chat Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-200">
                {getPersonaName('lead')}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                {selectedModel}
              </span>
              {enableGrounding && (
                <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800/40">
                  <Globe className="w-2.5 h-2.5" />
                  <span>Search Grounded</span>
                </span>
              )}
            </div>
            {/* Shared Global Model Badge under Lead Architect name */}
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                <span>{getGlobalModelBadge()}</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Role: <span className="text-slate-300 font-medium">{selectedRole}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onResetChat}
            title="Restart consultation conversation"
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Model & Role Persona Selector Bar */}
      <div className="px-3.5 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-[11px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-400 font-mono">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isSending}
            className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-2 py-0.5 text-[10px] font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="gemini-3.5-flash">gemini-3.5-flash (General Tasks / Grounded)</option>
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Tasks)</option>
          </select>

          <span className="text-[10px] text-slate-400 font-mono ml-1">Persona:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={isSending}
            className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-2 py-0.5 text-[10px] focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Lead Principal Software Architect">Lead Software Architect</option>
            <option value="Senior AppSec Specialist">Senior AppSec Specialist</option>
            <option value="High-Throughput Distributed Systems Engineer">Distributed Systems Engineer</option>
            <option value="Database & Transaction Integrity Specialist">Database & ACID Specialist</option>
          </select>
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300 select-none">
          <input
            type="checkbox"
            checked={enableGrounding}
            onChange={(e) => setEnableGrounding(e.target.checked)}
            disabled={isSending}
            className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <Globe className="w-3 h-3 text-sky-400" />
          <span>Google Search Grounding</span>
        </label>
      </div>

      {/* Messages Stream */}
      <div
        className={`p-3.5 space-y-3 ${
          isExpanded ? 'min-h-[380px] max-h-[560px]' : 'min-h-[220px] max-h-[380px]'
        } overflow-y-auto no-scrollbar`}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isLead = msg.sender === 'lead';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {isLead ? (
                  <>
                    <Bot className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-mono font-medium text-slate-400">
                      {msg.agentRole ? `${getPersonaName('lead')} (${msg.agentRole})` : getPersonaName('lead')}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40 flex items-center gap-1">
                      <Cpu className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                      <span>{getGlobalModelBadge()}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-mono font-medium text-slate-400">Engineering Stakeholder</span>
                    <User className="w-3 h-3 text-indigo-300" />
                  </>
                )}
                <span className="text-[9px] text-slate-600 font-mono">{msg.timestamp}</span>
              </div>

              <div
                className={`p-3 rounded-xl max-w-[94%] transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-950 to-indigo-900 border border-indigo-700/50 text-slate-100 rounded-tr-xs shadow-sm'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-xs shadow-sm'
                }`}
              >
                {renderMessageContent(msg.content)}

                {/* Grounding Sources Badge */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-sky-400">
                      <Globe className="w-3 h-3" />
                      <span>Google Search Grounding Verified Citations:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {msg.groundingSources.map((source, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-800/40 text-sky-300 truncate max-w-[260px]"
                          title={source}
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamically Extracted Updates Card */}
                {msg.extractedUpdates && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400 font-mono">
                      <Sparkles className="w-3 h-3" />
                      <span>Dynamically Extracted Architecture Updates</span>
                    </div>

                    {msg.extractedUpdates.functionalRequirements &&
                      msg.extractedUpdates.functionalRequirements.length > 0 && (
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded p-2 flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 font-mono">
                            + Functional Requirements Injected:
                          </span>
                          {msg.extractedUpdates.functionalRequirements.map((req, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] text-indigo-200">
                              <span className="text-indigo-400 font-mono">•</span>
                              <span>{req}</span>
                            </div>
                          ))}
                        </div>
                      )}

                    {msg.extractedUpdates.acceptanceCriteria &&
                      msg.extractedUpdates.acceptanceCriteria.length > 0 && (
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded p-2 flex flex-col gap-1">
                          <span className="text-[10px] text-emerald-400 font-mono">
                            ✓ Acceptance Criteria Added:
                          </span>
                          {msg.extractedUpdates.acceptanceCriteria.map((crit, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-200">
                              <span className="text-emerald-400 font-mono">✓</span>
                              <span>{crit}</span>
                            </div>
                          ))}
                        </div>
                      )}

                    {msg.extractedUpdates.contractDiffNote && (
                      <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-indigo-950/40 border border-indigo-800/40 text-[10px] text-indigo-300">
                        <div className="flex items-center gap-1.5">
                          <FileCode2 className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>{msg.extractedUpdates.contractDiffNote}</span>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400 shrink-0">
                          Applied to Schema
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Lead Architect Typing Indicator */}
        {isSending && (
          <div className="flex items-start gap-2 max-w-[85%]">
            <div className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>{selectedRole} is reasoning with {selectedModel}...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggested Reply Chips */}
      <div className="px-3 pt-2 pb-1 border-t border-slate-900 bg-slate-950/90 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <Lightbulb className="w-3 h-3 text-amber-400" />
          <span>Quick Suggested Architectural Inquiries:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {activeSuggestedReplies.map((chip, index) => (
            <button
              key={index}
              type="button"
              disabled={isSending}
              onClick={() => handleSend(chip)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-900 hover:bg-indigo-950 hover:text-indigo-200 text-slate-300 border border-slate-800 hover:border-indigo-700/60 transition-all whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box Bar */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          placeholder="What feature would you like to build? Type feature request or architectural question..."
          className="flex-1 text-xs font-sans bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors placeholder:text-slate-600 disabled:opacity-50"
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={isSending || !inputText.trim()}
          className="flex items-center justify-center p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xs transition-colors shrink-0 cursor-pointer"
          title="Send consultation message"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Lead Architect Recommended Crew Suggestion Bar (Gate 1 Discovery / Gate 3 Freeze) */}
      {!contract.frozen && recommendation && (
        <div className="px-3 py-2 bg-indigo-950/40 border-t border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-200">
                {getPersonaName('lead')} recommends:
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono">
                <span>Backend</span>
                <span className={recommendation.activeWorkers.backend ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  [{recommendation.activeWorkers.backend ? 'Active' : 'Dormant'}]
                </span>
                <span>,</span>
                <span>Frontend</span>
                <span className={recommendation.activeWorkers.frontend ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  [{recommendation.activeWorkers.frontend ? 'Active' : 'Dormant'}]
                </span>
                <span>,</span>
                <span>QA</span>
                <span className={recommendation.activeWorkers.qa ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  [{recommendation.activeWorkers.qa ? 'Active' : 'Dormant'}]
                </span>
              </span>
              <span className="text-[10px] text-slate-400 hidden lg:inline">
                ({recommendation.reason.slice(0, 50)}...)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              applyCrewRecommendation(recommendation.activeWorkers);
              setAppliedRecommendation(true);
              setTimeout(() => setAppliedRecommendation(false), 2500);
            }}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-300" />
            <span>{appliedRecommendation ? 'Recommendation Applied!' : 'Apply Recommendation'}</span>
          </button>
        </div>
      )}

      {/* Quick Action Footer: Gate 3 Freeze Contract Shortcut */}
      <div className="px-3 py-2 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 text-slate-400">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Contract Status: {contract.frozen ? (
              <span className="text-emerald-400 font-semibold font-mono">Frozen ({contract.version})</span>
            ) : (
              <span className="text-amber-400 font-semibold font-mono">Draft Awaiting Sign-off</span>
            )}
          </span>
        </div>

        {!contract.frozen && (
          requirementsBaseline ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">
                ✓ Gate 1 & 2 Cleared: Review Team Below
              </span>
              <button
                type="button"
                onClick={onApproveAndFreezeContract}
                className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-md transition-colors shadow-xs cursor-pointer"
              >
                <span>Approve & Dispatch</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            onCompileBaseline && (
              <button
                type="button"
                onClick={onCompileBaseline}
                className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-md transition-colors shadow-xs cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Finalize Plan & Review Crew (Gate 1 & 2)</span>
              </button>
            )
          )
        )}
      </div>
    </div>
  );
};
