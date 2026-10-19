import React, { useState } from 'react';
import {
  Server,
  Monitor,
  CheckCheck,
  Compass,
  Power,
  Plus,
  Trash2,
  X,
  Shield,
  Code2,
  ArrowRight,
  Sparkles,
  GitBranch,
  FolderLock,
  Layers,
  Cpu,
  Check,
} from 'lucide-react';
import {
  WorkerTask,
  AgentPersona,
  RequirementsBaseline,
  ArchitectChatMessage,
  ContractSchema,
} from '../types/agentforge';
import { useAgentPersonas } from '../context/AgentPersonaContext';
import { analyzeCrewRecommendation } from '../services/leadArchitectChatService';
import { ArchitectureVisualizer } from './ArchitectureVisualizer';

interface TeamRosterCardProps {
  tasks: WorkerTask[];
  requirementsBaseline: RequirementsBaseline | null;
  contractVersion: string;
  onApproveAndDispatch: () => void;
  isSimulating?: boolean;
  featurePrompt?: string;
  chatMessages?: ArchitectChatMessage[];
  simulateCiFailure?: boolean;
  onToggleCiFailure?: (val: boolean) => void;
  contract?: ContractSchema;
  onInspectWorker?: (persona: string) => void;
}

export const TeamRosterCard: React.FC<TeamRosterCardProps> = ({
  tasks,
  requirementsBaseline,
  contractVersion,
  onApproveAndDispatch,
  isSimulating = false,
  featurePrompt = '',
  chatMessages = [],
  simulateCiFailure = false,
  onToggleCiFailure,
  contract,
  onInspectWorker,
}) => {
  const {
    getPersonaName,
    getGlobalModelBadge,
    fleetState,
    toggleAgentActive,
    setAgentActive,
    customAgents,
    addCustomAgent,
    removeCustomAgent,
  } = useAgentPersonas();

  // Tab switcher state: Fleet vs Architecture
  const [activeTab, setActiveTab] = useState<'fleet' | 'architecture'>('fleet');

  // Custom Agent Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customScope, setCustomScope] = useState('');
  const [customDirective, setCustomDirective] = useState('');

  // Lead Architect Crew Recommendation analysis
  const recommendation = analyzeCrewRecommendation(featurePrompt, chatMessages);

  const handleApplyRecommendation = () => {
    if (!recommendation?.activeWorkers) return;
    Object.entries(recommendation.activeWorkers).forEach(([role, isActive]) => {
      setAgentActive(role, isActive);
    });
  };

  const handleCreateCustomAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    addCustomAgent({
      title: customTitle.trim(),
      name: customTitle.trim(),
      permittedScope: customScope.trim() || 'src/**',
      systemDirective:
        customDirective.trim() ||
        `Focus strictly on ${customTitle.trim()} tasks within ${customScope.trim() || 'src/**'}.`,
    });

    setCustomTitle('');
    setCustomScope('');
    setCustomDirective('');
    setIsAddModalOpen(false);
  };

  const getPersonaIcon = (persona: AgentPersona) => {
    switch (persona) {
      case 'lead':
        return <Compass className="w-4 h-4 text-indigo-400" />;
      case 'backend':
        return <Server className="w-4 h-4 text-emerald-400" />;
      case 'frontend':
        return <Monitor className="w-4 h-4 text-sky-400" />;
      case 'qa':
        return <CheckCheck className="w-4 h-4 text-amber-400" />;
      default:
        return <Code2 className="w-4 h-4 text-purple-400" />;
    }
  };

  // Combine default worker personas + custom agents
  const defaultWorkers: { role: 'backend' | 'frontend' | 'qa'; title: string }[] = [
    { role: 'backend', title: 'Backend Worker' },
    { role: 'frontend', title: 'Frontend Worker' },
    { role: 'qa', title: 'QA Worker' },
  ];

  const totalWorkersCount = defaultWorkers.length + customAgents.length;
  const activeWorkersCount =
    defaultWorkers.filter((w) => fleetState[w.role] ?? true).length +
    customAgents.filter((c) => c.isActive).length;
  const dormantWorkersCount = totalWorkersCount - activeWorkersCount;

  return (
    <div className="flex flex-col bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-xl shadow-indigo-950/20 transition-all animate-fade-in mt-3">
      {/* Header: Stage Milestone & Fleet Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                Team Roster & Task Assignment
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                Gate 2 Cleared
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review assigned crew and task scopes before freezing contract {contractVersion}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {contract && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('fleet')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'fleet'
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Crew Fleet</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('architecture')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'architecture'
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Visualize Architecture</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/50 rounded-lg transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Agent</span>
          </button>
        </div>
      </div>

      {activeTab === 'architecture' && contract ? (
        <div className="mt-4">
          <ArchitectureVisualizer contract={contract} tasks={tasks} isInline />
        </div>
      ) : (
        <>
          {/* Lead Architect Recommended Crew Suggestion Bar */}
          {recommendation && (
        <div className="mt-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
            <div className="text-xs text-slate-200">
              <span className="font-semibold text-indigo-300">
                {getPersonaName('lead')}&apos;s Recommendation:
              </span>{' '}
              <span className="text-slate-300">
                Backend [
                {recommendation.activeWorkers.backend ? (
                  <span className="text-emerald-400 font-semibold">Active</span>
                ) : (
                  <span className="text-slate-400">Dormant</span>
                )}
                ], Frontend [
                {recommendation.activeWorkers.frontend ? (
                  <span className="text-sky-400 font-semibold">Active</span>
                ) : (
                  <span className="text-slate-400">Dormant</span>
                )}
                ], QA [
                {recommendation.activeWorkers.qa ? (
                  <span className="text-amber-400 font-semibold">Active</span>
                ) : (
                  <span className="text-slate-400">Dormant</span>
                )}
                ]
              </span>
              <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                — {recommendation.reason}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyRecommendation}
            className="flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Recommendation</span>
          </button>
        </div>
      )}

      {/* Grid of Assigned Workers with Power Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        {/* Baseline Worker Personas */}
        {defaultWorkers.map(({ role, title }) => {
          const isActive = fleetState[role] ?? true;
          const assignedTask = tasks.find((t) => t.persona === role);

          return (
            <div
              key={role}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 relative ${
                isActive
                  ? 'bg-slate-950/70 border-slate-700/80 shadow-md ring-1 ring-slate-800'
                  : 'bg-slate-950/30 border-slate-900 opacity-60 grayscale-[40%]'
              }`}
            >
              <div>
                {/* Header: Persona Name + Power Switch */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {getPersonaIcon(role)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 leading-none">
                        {getPersonaName(role)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{title}</div>
                    </div>
                  </div>

                  {/* Interactive Power / Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => toggleAgentActive(role)}
                    title={isActive ? 'Deactivate agent (set Dormant)' : 'Activate agent'}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 hover:bg-emerald-900'
                        : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Power className={`w-3 h-3 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>{isActive ? 'Active' : 'Dormant'}</span>
                  </button>
                </div>

                {/* Status Badge: Dormant Notice or Active File Boundary */}
                {!isActive ? (
                  <div className="py-2 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-[10px] text-slate-400">
                      Dormant (0 tokens consumed)
                    </span>
                    <span className="text-[10px] text-slate-500">Excluded</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-300 leading-snug">
                      <span className="font-semibold text-slate-200 block text-[11px] mb-0.5">
                        Assigned Task:
                      </span>
                      {assignedTask?.title ||
                        (role === 'backend'
                          ? 'Implement REST DTO contract endpoints'
                          : role === 'frontend'
                          ? 'Build reactive client views & state hooks'
                          : 'Validate test suites & contract invariant checks')}
                    </div>

                    <div className="flex flex-col gap-1 pt-1 text-[10px] font-mono text-slate-400">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <FolderLock className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">
                          Scope:{' '}
                          {assignedTask?.permittedFiles?.join(', ') ||
                            (role === 'backend'
                              ? 'src/api/**, server.ts'
                              : role === 'frontend'
                              ? 'src/components/**'
                              : 'src/tests/**')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <GitBranch className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">
                          Branch: {assignedTask?.branch || `feat/${role}-worker`}
                        </span>
                      </div>
                      {onInspectWorker && (
                        <div className="pt-1.5 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInspectWorker(role);
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-mono text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/60 border border-indigo-900/60 transition-colors cursor-pointer flex items-center gap-1"
                            title={`Inspect exact code written by ${name}`}
                          >
                            <Code2 className="w-2.5 h-2.5" />
                            <span>Inspect Code</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Custom Agents */}
        {customAgents.map((agent) => {
          const isActive = agent.isActive;
          return (
            <div
              key={agent.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 relative ${
                isActive
                  ? 'bg-slate-950/70 border-purple-500/40 shadow-md ring-1 ring-purple-500/20'
                  : 'bg-slate-950/30 border-slate-900 opacity-60 grayscale-[40%]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/40">
                      <Code2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 leading-none">
                        {agent.name}
                      </div>
                      <div className="text-[10px] text-purple-400 font-mono mt-0.5">Custom Persona</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleAgentActive(agent.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-600/50 hover:bg-purple-900'
                          : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Power className={`w-3 h-3 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                      <span>{isActive ? 'Active' : 'Dormant'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCustomAgent(agent.id)}
                      title="Remove custom agent"
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!isActive ? (
                  <div className="py-2 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-[10px] text-slate-400">
                      Dormant (0 tokens consumed)
                    </span>
                    <span className="text-[10px] text-slate-500">Excluded</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-300 leading-snug">
                      <span className="font-semibold text-slate-200 block text-[11px] mb-0.5">
                        Directive:
                      </span>
                      {agent.systemDirective}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-purple-300 pt-1">
                      <FolderLock className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate">Scope: {agent.permittedScope}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: Fleet Summary and Dispatch Button */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{activeWorkersCount} Active Workers</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span>{dormantWorkersCount} Dormant</span>
          </div>
          {dormantWorkersCount > 0 && (
            <>
              <span>•</span>
              <span className="text-emerald-400">0 Tokens Consumed for Dormant</span>
            </>
          )}
          {onToggleCiFailure && (
            <>
              <span className="hidden sm:inline">•</span>
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={simulateCiFailure}
                  onChange={(e) => onToggleCiFailure(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-rose-500 accent-rose-500 cursor-pointer"
                />
                <span className="text-[11px] font-sans">Simulate CI failure (test repair)</span>
              </label>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onApproveAndDispatch}
          disabled={isSimulating}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          <span>Approve Plan & Dispatch Agents</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      </>
      )}

      {/* Add Custom Agent Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-slate-100">Add Custom Worker Agent</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomAgent} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Agent Role / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DevOps Engineer, Security Auditor, Data Engineer"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Permitted File Scope (Glob Pattern)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. docker/**, .github/**, src/security/**"
                  value={customScope}
                  onChange={(e) => setCustomScope(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  System Directive & Responsibilities
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Validate Docker compose manifests and enforce zero-trust network configurations."
                  value={customDirective}
                  onChange={(e) => setCustomDirective(e.target.value)}
                  className="w-full text-xs font-sans bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm cursor-pointer"
                >
                  Create Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
