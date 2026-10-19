import React, { useState } from 'react';
import {
  Compass,
  Server,
  Monitor,
  CheckCheck,
  FolderLock,
  GitBranch,
  ArrowRight,
  Cpu,
  Power,
  Plus,
  Trash2,
  X,
  Shield,
  Code2,
} from 'lucide-react';
import { WorkerTask, AgentPersona, WorkerTaskStatus, CustomAgentConfig } from '../types/agentforge';
import { useAgentPersonas } from '../context/AgentPersonaContext';

interface AgentKanbanProps {
  tasks: WorkerTask[];
  onSelectTaskBranch?: (branch: string) => void;
  selectedBranch?: string;
  isPlanReview?: boolean;
  onApproveAndDispatch?: () => void;
  contractVersion?: string;
  onInspectWorker?: (persona: string) => void;
}

const PERSONA_CONFIG: Record<
  string,
  { label: string; defaultName: string; roleDesc: string; icon: React.ElementType; color: string }
> = {
  lead: {
    label: 'Lead Architect',
    defaultName: 'Alex Vance',
    roleDesc: 'Discovery, RFC & Contract Governance',
    icon: Compass,
    color: 'text-indigo-400 bg-indigo-950/60 border-indigo-700/40',
  },
  backend: {
    label: 'Backend Worker',
    defaultName: 'Marcus Blake',
    roleDesc: 'API routes, DB models & auth services',
    icon: Server,
    color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/40',
  },
  frontend: {
    label: 'Frontend Worker',
    defaultName: 'Sarah Chen',
    roleDesc: 'Client UI components, forms & responsive styling',
    icon: Monitor,
    color: 'text-sky-400 bg-sky-950/60 border-sky-700/40',
  },
  qa: {
    label: 'QA Worker',
    defaultName: 'Elena Rostova',
    roleDesc: 'Automated test suites & security checks',
    icon: CheckCheck,
    color: 'text-amber-400 bg-amber-950/60 border-amber-700/40',
  },
};

function getStatusBadge(status: WorkerTaskStatus) {
  switch (status) {
    case 'idle':
      return { text: 'Idle', style: 'text-slate-400 bg-slate-800 border-slate-700' };
    case 'blocked_contract':
      return { text: 'Blocked (Gate 3)', style: 'text-amber-300 bg-amber-950/70 border-amber-700/50' };
    case 'drafting':
      return { text: 'Drafting RFC', style: 'text-indigo-300 bg-indigo-950/70 border-indigo-700/50' };
    case 'coding':
      return { text: 'Coding', style: 'text-sky-300 bg-sky-950/70 border-sky-700/50' };
    case 'awaiting_ci':
      return { text: 'Awaiting CI', style: 'text-amber-300 bg-amber-950/70 border-amber-700/50' };
    case 'awaiting_decision':
      return { text: 'Awaiting Decision', style: 'text-purple-300 bg-purple-950/70 border-purple-700/50' };
    case 'completed':
      return { text: 'Ready / Merged', style: 'text-emerald-300 bg-emerald-950/70 border-emerald-700/50' };
    case 'failed':
      return { text: 'CI Failed', style: 'text-rose-300 bg-rose-950/70 border-rose-700/50' };
  }
}

export const AgentKanban: React.FC<AgentKanbanProps> = ({
  tasks,
  onSelectTaskBranch,
  selectedBranch,
  isPlanReview = false,
  onApproveAndDispatch,
  contractVersion,
  onInspectWorker,
}) => {
  const {
    getPersonaName,
    getGlobalModelBadge,
    fleetState,
    toggleAgentActive,
    customAgents,
    addCustomAgent,
    removeCustomAgent,
  } = useAgentPersonas();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newName, setNewName] = useState('');
  const [newScope, setNewScope] = useState('');
  const [newDirective, setNewDirective] = useState('');

  const handleCreateCustomAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addCustomAgent({
      title: newTitle.trim(),
      name: newName.trim() || newTitle.trim(),
      permittedScope: newScope.trim() || 'custom/**/*',
      systemDirective: newDirective.trim() || 'Autonomous worker operating within isolated scope.',
    });

    setNewTitle('');
    setNewName('');
    setNewScope('');
    setNewDirective('');
    setIsAddModalOpen(false);
  };

  return (
    <div className={`flex flex-col gap-2.5 ${isPlanReview ? 'p-3.5 sm:p-4 rounded-xl border border-indigo-500/40 bg-slate-900/90 shadow-lg ring-1 ring-indigo-500/20 animate-fade-in' : ''}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {isPlanReview
              ? `Gate 2 Plan: Team Roster & Task Assignment (${tasks.length + customAgents.length} Agents)`
              : `Agent Kanban Matrix (${tasks.length + customAgents.length} Personas)`}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-800/40 hidden sm:inline-block">
            {getGlobalModelBadge()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Custom Agent</span>
          </button>

          {isPlanReview && onApproveAndDispatch && (
            <button
              type="button"
              onClick={onApproveAndDispatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <span>Approve Plan & Dispatch Agents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isPlanReview && (
        <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              Review assigned workers below, flip power switches (Active / Dormant) to optimize token consumption, then click <strong>Approve Plan & Dispatch Agents</strong> to start coding.
            </span>
          </div>
          {contractVersion && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 shrink-0">
              Contract {contractVersion}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Baseline Persona Tasks */}
        {tasks.map((task) => {
          const cfg = PERSONA_CONFIG[task.persona] || {
            label: task.persona,
            defaultName: task.persona,
            roleDesc: 'Specialized Worker',
            icon: Code2,
            color: 'text-violet-400 bg-violet-950/60 border-violet-700/40',
          };
          const Icon = cfg.icon;
          const statusBadge = getStatusBadge(task.status);
          const isSelected = selectedBranch === task.branch;
          const dynamicName = getPersonaName(task.persona);
          const isLead = task.persona === 'lead';
          const isActive = isLead || fleetState[task.persona] !== false;

          return (
            <div
              key={task.id}
              onClick={() => onSelectTaskBranch && onSelectTaskBranch(task.branch)}
              className={`flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer group ${
                !isActive
                  ? 'bg-slate-950/50 border-slate-800/50 opacity-60 grayscale-[40%]'
                  : isSelected
                  ? 'border-indigo-500/70 ring-1 ring-indigo-500/30 bg-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/70 hover:bg-slate-900/90'
              }`}
            >
              {/* Persona Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      !isActive ? 'text-slate-500 bg-slate-900 border-slate-800' : cfg.color
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-bold text-slate-200 truncate">
                        {dynamicName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        ({cfg.label})
                      </span>
                    </div>
                    {/* Shared Global Model Badge under agent name */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 truncate flex items-center gap-1">
                        <Cpu className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{getGlobalModelBadge()}</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate mt-0.5">
                      {cfg.roleDesc}
                    </span>
                  </div>
                </div>

                {/* Right controls: Power toggle & Status chip */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {/* Power Toggle Switch */}
                  {isLead ? (
                    <span
                      title="Lead Architect is permanent orchestrator"
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60"
                    >
                      Permanent
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAgentActive(task.persona);
                      }}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                      title={isActive ? 'Deactivate Worker (Set Dormant)' : 'Activate Worker'}
                    >
                      <Power className={`w-2.5 h-2.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{isActive ? 'Active' : 'Dormant'}</span>
                    </button>
                  )}

                  {/* Status chip / Dormant badge */}
                  {!isActive ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 whitespace-nowrap">
                      Dormant (0 tokens consumed)
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap ${statusBadge.style}`}
                    >
                      {statusBadge.text}
                    </span>
                  )}
                </div>
              </div>

              {/* Task title */}
              <div className="text-xs font-medium text-slate-300 mt-0.5 line-clamp-1">
                {task.title}
              </div>

              {/* Current Action / Commit */}
              {task.currentAction && (
                <div className="text-[11px] text-slate-400 mt-1 font-mono truncate flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{task.currentAction}</span>
                </div>
              )}

              {/* Branch & Permitted file boundaries */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1 truncate text-indigo-300">
                    <GitBranch className="w-3 h-3 shrink-0" />
                    <span className="truncate">{task.branch}</span>
                  </div>
                  <span className="text-slate-500 shrink-0">{task.contractVersion}</span>
                </div>

                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono truncate">
                    <FolderLock className="w-3 h-3 shrink-0 text-slate-600" />
                    <span className="truncate">
                      Scope: {task.permittedFiles.slice(0, 2).join(', ')}
                      {task.permittedFiles.length > 2 ? ` +${task.permittedFiles.length - 2}` : ''}
                    </span>
                  </div>
                  {onInspectWorker && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectWorker(task.persona);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/60 border border-indigo-900/60 shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                      title={`Inspect exact code written by ${dynamicName}`}
                    >
                      <Code2 className="w-2.5 h-2.5" />
                      <span>Inspect</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Custom Agents */}
        {customAgents.map((custom) => {
          const isActive = fleetState[custom.id] !== false;
          return (
            <div
              key={custom.id}
              className={`flex flex-col justify-between p-3 rounded-xl border transition-all ${
                !isActive
                  ? 'bg-slate-950/50 border-slate-800/50 opacity-60'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-violet-400 bg-violet-950/60 border-violet-700/40">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-bold text-slate-200 truncate">{custom.name}</span>
                      <span className="text-[10px] text-violet-300 font-mono truncate">
                        ({custom.title})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 truncate flex items-center gap-1">
                        <Cpu className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{getGlobalModelBadge()}</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate mt-0.5">
                      {custom.systemDirective}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleAgentActive(custom.id)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Power className={`w-2.5 h-2.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{isActive ? 'Active' : 'Dormant'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeCustomAgent(custom.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete custom agent"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {!isActive ? (
                <div className="text-[10px] font-mono text-slate-500 px-2 py-1 rounded bg-slate-900 border border-slate-800 mt-2">
                  Dormant (0 tokens consumed)
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 mt-2 font-mono truncate flex items-center gap-1.5">
                  <FolderLock className="w-3 h-3 text-violet-400 shrink-0" />
                  <span>Scope: {custom.permittedScope}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Agent Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Create Custom Autonomous Agent</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomAgent} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Role Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. DevOps Engineer, Security Auditor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Agent Persona Name (Optional)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Liam Cross"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Permitted File Scope Pattern</label>
                <input
                  type="text"
                  required
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  placeholder="e.g. docker/**, .github/**, infra/**"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 font-mono focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">System Prompt Directive</label>
                <textarea
                  rows={2}
                  value={newDirective}
                  onChange={(e) => setNewDirective(e.target.value)}
                  placeholder="e.g. Audit infrastructure definitions, generate Dockerfiles and CI workflows."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
                >
                  Add Agent to Fleet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

