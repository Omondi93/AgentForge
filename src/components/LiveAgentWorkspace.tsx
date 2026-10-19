import React, { useState } from 'react';
import {
  Compass,
  Server,
  Monitor,
  CheckCheck,
  Shield,
  Sparkles,
  Play,
  ArrowRight,
  ExternalLink,
  Code2,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
  AlertTriangle,
  FileCode2,
  Lock,
  Cpu,
  Power,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  WorkerTask,
  ContractSchema,
  PlanningStage,
  AgentPersona,
  DeploymentState,
} from '../types/agentforge';
import { useAgentPersonas } from '../context/AgentPersonaContext';

interface LiveAgentWorkspaceProps {
  tasks: WorkerTask[];
  stage: PlanningStage;
  contract: ContractSchema;
  featurePrompt: string;
  selectedPresetId: string;
  isSimulating: boolean;
  onRunSimulation: () => void;
  onApproveAndFreeze?: () => void;
  onViewLivePreview?: () => void;
  onSwitchToCodeView?: () => void;
  deploymentState?: DeploymentState;
  onInspectWorker?: (persona: string) => void;
}

interface AgentProfile {
  name: string;
  title: string;
  specialty: string;
  avatarBg: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  icon: React.ElementType;
}

const AGENT_PROFILES: Record<AgentPersona, AgentProfile> = {
  lead: {
    name: 'Alex Vance',
    title: 'Lead Systems Architect',
    specialty: 'System blueprint, security boundaries & contract safety',
    avatarBg: 'bg-indigo-600',
    borderColor: 'border-indigo-500/50',
    textColor: 'text-indigo-400',
    glowColor: 'shadow-indigo-500/20',
    icon: Compass,
  },
  backend: {
    name: 'Marcus Blake',
    title: 'Backend & Cloud Engineer',
    specialty: 'REST API routes, database schemas & token encryption',
    avatarBg: 'bg-emerald-600',
    borderColor: 'border-emerald-500/50',
    textColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/20',
    icon: Server,
  },
  frontend: {
    name: 'Sarah Chen',
    title: 'UI & Experience Designer',
    specialty: 'Interactive React components, responsive layouts & styling',
    avatarBg: 'bg-sky-600',
    borderColor: 'border-sky-500/50',
    textColor: 'text-sky-400',
    glowColor: 'shadow-sky-500/20',
    icon: Monitor,
  },
  qa: {
    name: 'Elena Rostova',
    title: 'Security & Quality Sentinel',
    specialty: 'Automated regression test suites & penetration attacks',
    avatarBg: 'bg-amber-600',
    borderColor: 'border-amber-500/50',
    textColor: 'text-amber-400',
    glowColor: 'shadow-amber-500/20',
    icon: CheckCheck,
  },
};

export const LiveAgentWorkspace: React.FC<LiveAgentWorkspaceProps> = ({
  tasks,
  stage,
  contract,
  featurePrompt,
  selectedPresetId,
  isSimulating,
  onRunSimulation,
  onApproveAndFreeze,
  onViewLivePreview,
  onSwitchToCodeView,
  deploymentState,
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
  const [selectedAgent, setSelectedAgent] = useState<AgentPersona | null>(null);

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

  // Calculate Progress Percentage and Stage Headline
  const getProgressInfo = () => {
    switch (stage) {
      case 'discovery':
        return {
          percent: 20,
          label: '20% Complete — Analyzing Requirements & Clarifications',
          subtext: 'Lead Architect is reviewing user requests and building technical questions.',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        };
      case 'requirements_approval':
        return {
          percent: 40,
          label: '40% Complete — Architecture Blueprint Review',
          subtext: 'Decisions are logged and the safety contract is drafted.',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        };
      case 'task_planning':
        return {
          percent: 55,
          label: '55% Complete — Decomposing Tasks for Autonomous Workers',
          subtext: 'Backend and Frontend branches created with strict file boundary policies.',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        };
      case 'contract_freeze':
        return {
          percent: 65,
          label: '65% Complete — Security Contract Ready for Approval',
          subtext: 'Workers are paused at Gate 3 awaiting contract lock before coding.',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'executing':
        return {
          percent: 80,
          label: '80% Complete — Autonomous Agents Actively Coding & Designing',
          subtext: 'Backend and Frontend agents generating verified code and styling components.',
          badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        };
      case 'ci_waiting':
        return {
          percent: 90,
          label: '90% Complete — Running Automated Quality & Security Checks',
          subtext: 'QA agent running automated test suites to ensure 100% reliability.',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'ci_failed':
        return {
          percent: 85,
          label: '85% Paused — 1 Automated Test Flagged an Issue',
          subtext: 'QA agent caught a type mismatch. 1-Click auto-repair ready.',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
      case 'merged':
        return {
          percent: 100,
          label: '100% Ready — Feature Tested, Verified & Live in Production!',
          subtext: 'All automated security tests passed with zero errors or breaking changes.',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      default:
        return {
          percent: 50,
          label: '50% In Progress — Orchestrating Multi-Agent Workflow',
          subtext: 'Coordinating autonomous agents across isolated workspaces.',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        };
    }
  };

  // Generate plain-English "What I'm Doing Right Now" text for each agent
  const getAgentCurrentAction = (persona: AgentPersona) => {
    const isAuth = selectedPresetId === 'auth';
    const isBilling = selectedPresetId === 'billing';
    const isWebhooks = selectedPresetId === 'webhooks';

    if (stage === 'discovery' || stage === 'requirements_approval') {
      switch (persona) {
        case 'lead':
          return `Reviewing your goals for "${featurePrompt.slice(0, 48)}...". Asking clarifying questions to formulate a resilient architectural blueprint.`;
        case 'backend':
          return 'Standing by in sandbox. Reviewing data flow models while Lead Architect formalizes the contract.';
        case 'frontend':
          return 'Preparing responsive mockups and component hierarchy for user review.';
        case 'qa':
          return 'Drafting validation criteria and edge-case penetration test specifications.';
      }
    }

    if (stage === 'contract_freeze') {
      switch (persona) {
        case 'lead':
          return 'Contract draft v1.2 prepared! Invariant rules enforce zero breaking changes once frozen.';
        case 'backend':
          return 'Holding in Gate 3 barrier. Ready to scaffold API controllers the instant contract is locked.';
        case 'frontend':
          return 'Holding in Gate 3 barrier. Ready to mount accessible UI forms using the typed interface.';
        case 'qa':
          return 'Test harness configured. Waiting for worker branches to initiate automated test pipelines.';
      }
    }

    if (stage === 'executing') {
      switch (persona) {
        case 'lead':
          return 'Overseeing Backend & Frontend implementation. Ensuring strict boundary isolation between API routes and client state.';
        case 'backend':
          return isAuth
            ? 'Assembling the POST /api/auth/login and /register routes with bcrypt password hashing and secure HttpOnly cookie sessions.'
            : isBilling
            ? 'Implementing Stripe checkout session creation with PCI-compliant token handling and webhook listeners.'
            : 'Configuring HMAC SHA-256 webhook dispatcher with replay protection and retry queue.';
        case 'frontend':
          return isAuth
            ? 'Assembling the email/password login box with submit validation, error banners, and dark/light mode toggle support.'
            : isBilling
            ? 'Styling pricing tier comparison cards with monthly/annual billing switcher and instant checkout trigger.'
            : 'Building real-time event status dashboard with color-coded HTTP response badges.';
        case 'qa':
          return isAuth
            ? 'Running 5 automated security tests to ensure bad passwords and SQL injections are blocked, and tokens cannot be spoofed.'
            : isBilling
            ? 'Simulating payment authorization webhooks to verify subscription plans activate correctly.'
            : 'Fuzz-testing payload parser to verify corrupted JSON signatures are gracefully rejected.';
      }
    }

    if (stage === 'ci_waiting') {
      switch (persona) {
        case 'lead':
          return 'Inspecting submitted pull requests and validating schema conformance against contract v1.2.';
        case 'backend':
          return 'Pull Request #104 opened! All server routes compiled cleanly into the Next.js runtime.';
        case 'frontend':
          return 'Components rendered and styled! Visual interactive preview ready for testing.';
        case 'qa':
          return 'Running 5 automated security tests to ensure bad passwords are blocked and all edge cases pass.';
      }
    }

    if (stage === 'ci_failed') {
      switch (persona) {
        case 'lead':
          return 'Detected test failure on backend type signature. Formulated 1-click bounded auto-fix with zero regressions.';
        case 'backend':
          return 'Awaiting auto-triage patch to align user role enum in app/api/auth/login/route.ts.';
        case 'frontend':
          return 'Frontend UI components remain functional and verified.';
        case 'qa':
          return 'Security sentinel caught type mismatch. Merge safely blocked until auto-fix is applied.';
      }
    }

    if (stage === 'merged') {
      switch (persona) {
        case 'lead':
          return 'Architecture contract successfully merged into main branch. All quality & safety invariants preserved!';
        case 'backend':
          return 'Backend APIs deployed and running in production. Server responses under 45ms.';
        case 'frontend':
          return 'UI components published and live! Visual interactive app ready for executive sign-off.';
        case 'qa':
          return 'Final verification passed: 100% test assertions green, zero security vulnerabilities found.';
      }
    }

    return `Active and collaborating on the ${featurePrompt.slice(0, 40)} feature.`;
  };

  const getAgentStatusChip = (persona: AgentPersona) => {
    switch (stage) {
      case 'discovery':
        return persona === 'lead' ? 'Clarifying Design' : 'Standby';
      case 'requirements_approval':
        return persona === 'lead' ? 'Drafting Blueprint' : 'Standby';
      case 'contract_freeze':
        return persona === 'lead' ? 'Awaiting Approval' : 'Gate 3 Barrier';
      case 'executing':
        return persona === 'lead' ? 'Safety Overseer' : 'Actively Coding';
      case 'ci_waiting':
        return persona === 'qa' ? 'Running 5 Tests' : 'PR Submitted';
      case 'ci_failed':
        return persona === 'qa' ? '1 Check Failed' : 'Awaiting Fix';
      case 'merged':
        return 'Verified & Published';
      default:
        return 'Active';
    }
  };

  const progress = getProgressInfo();

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-y-auto p-4 sm:p-6 transition-colors duration-200">
      {/* 1. Header Bar: Feature Title & Executive Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Interactive Agent Workroom
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>4 Autonomous Agents Online</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hidden sm:inline-block">
              {getGlobalModelBadge()}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Live Multi-Agent Collaboration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Watch autonomous AI engineers research, code, test, and polish your feature in real-time.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2 shrink-0">
          {onViewLivePreview && (
            <button
              type="button"
              onClick={onViewLivePreview}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>See Live App UI</span>
            </button>
          )}

          {onSwitchToCodeView && (
            <button
              type="button"
              onClick={onSwitchToCodeView}
              title="Inspect raw TypeScript contract & checksums"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">View Technical Contract</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Progress Gauge Card */}
      <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {progress.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {progress.subtext}
            </p>
          </div>
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border self-start sm:self-auto ${progress.badgeColor}`}
          >
            {progress.percent}% Ready
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700/60 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        {/* Milestone Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <CheckCircle2
              className={`w-3.5 h-3.5 shrink-0 ${
                progress.percent >= 20 ? 'text-emerald-500' : 'text-slate-400'
              }`}
            />
            <span>1. Discovery & Design</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <CheckCircle2
              className={`w-3.5 h-3.5 shrink-0 ${
                progress.percent >= 60 ? 'text-emerald-500' : 'text-slate-400'
              }`}
            />
            <span>2. Security Architecture</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <CheckCircle2
              className={`w-3.5 h-3.5 shrink-0 ${
                progress.percent >= 80 ? 'text-emerald-500' : 'text-slate-400'
              }`}
            />
            <span>3. Autonomous Build</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <CheckCircle2
              className={`w-3.5 h-3.5 shrink-0 ${
                progress.percent === 100 ? 'text-emerald-500' : 'text-slate-400'
              }`}
            />
            <span>4. Quality & Release</span>
          </div>
        </div>
      </div>

      {/* 3. Gate 3 Approval Banner (if unfrozen in Non-Tech view) */}
      {!contract.frozen && onApproveAndFreeze && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Action Required: Approve Architecture Blueprint
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                The Lead Architect has designed the safety contract. Workers will immediately begin building once you approve.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onApproveAndFreeze}
            className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            Approve & Authorize Build
          </button>
        </div>
      )}

      {/* 4. Visual Persona Cards (The 4 Agents & Custom Crew) */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Specialized Engineering Personas</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {4 + customAgents.length} Agents
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Click any agent to inspect deliverables
            </span>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Custom Agent</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(AGENT_PROFILES) as AgentPersona[]).map((persona) => {
            const profile = AGENT_PROFILES[persona];
            const Icon = profile.icon;
            const currentAction = getAgentCurrentAction(persona);
            const statusChip = getAgentStatusChip(persona);
            const isSelected = selectedAgent === persona;
            const isLead = persona === 'lead';
            const isActive = isLead || fleetState[persona] !== false;

            return (
              <div
                key={persona}
                onClick={() => {
                  if (onInspectWorker) {
                    onInspectWorker(persona);
                  } else {
                    setSelectedAgent(isSelected ? null : persona);
                  }
                }}
                className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group bg-white dark:bg-slate-900/80 ${
                  !isActive
                    ? 'opacity-60 grayscale-[35%] border-slate-200 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-950/40'
                    : isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                }`}
              >
                {/* Agent Header & Avatar */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl ${
                        !isActive ? 'bg-slate-500' : profile.avatarBg
                      } text-white flex items-center justify-center font-bold text-base shadow-md ${
                        !isActive ? '' : profile.glowColor
                      } shrink-0 ring-2 ring-white/20`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {getPersonaName(persona)}
                        </span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 truncate flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                          <span>{getGlobalModelBadge()}</span>
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mt-0.5">
                        {profile.title}
                      </span>
                    </div>
                  </div>

                  {/* Right Header: Power Switch & Status Chip */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {/* Active / Dormant Power Switch */}
                    {isLead ? (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                        Permanent
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAgentActive(persona);
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700'
                        }`}
                        title={isActive ? 'Deactivate Worker (Set Dormant)' : 'Activate Worker'}
                      >
                        <Power className={`w-2.5 h-2.5 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span>{isActive ? 'Active' : 'Dormant'}</span>
                      </button>
                    )}

                    {!isActive ? (
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 whitespace-nowrap">
                        Dormant (0 tokens consumed)
                      </span>
                    ) : (
                      <span
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border shrink-0 ${
                          stage === 'merged'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : stage === 'ci_failed' && persona === 'qa'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                        }`}
                      >
                        {statusChip}
                      </span>
                    )}
                  </div>
                </div>

                {/* Plain-English Specialty */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3.5 italic">
                  Role: {profile.specialty}
                </p>

                {/* Animated Thinking/Working Bubble */}
                <div className="mt-auto p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 relative">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      {isActive ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping opacity-75" />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        </>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {isActive ? "What I'm doing right now" : 'Worker Dormant'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                    {isActive
                      ? `"${currentAction}"`
                      : 'Worker is paused in standby mode. Excluded from dispatches with zero tokens consumed.'}
                  </p>
                </div>

                {/* Bottom Delivered Value Chip */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">
                    {persona === 'lead' && 'Blueprint: Contract v1.2'}
                    {persona === 'backend' && 'Scope: app/api/**/* & src/server/**/*'}
                    {persona === 'frontend' && 'Scope: components/auth/*'}
                    {persona === 'qa' && 'Scope: Vitest & Security'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onInspectWorker) onInspectWorker(persona);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <span>Inspect Code</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Custom Agents in Live Workspace */}
          {customAgents.map((custom) => {
            const isActive = fleetState[custom.id] !== false;
            return (
              <div
                key={custom.id}
                className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all bg-white dark:bg-slate-900/80 ${
                  !isActive
                    ? 'opacity-60 grayscale-[35%] border-slate-200 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-950/40'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl ${custom.avatarBg || 'bg-violet-600'} text-white flex items-center justify-center font-bold text-base shadow-md shrink-0 ring-2 ring-white/20`}
                    >
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {custom.name}
                        </span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 truncate flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                          <span>{getGlobalModelBadge()}</span>
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mt-0.5">
                        {custom.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleAgentActive(custom.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <Power className={`w-2.5 h-2.5 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span>{isActive ? 'Active' : 'Dormant'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => removeCustomAgent(custom.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete custom agent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3.5 italic">
                  Directive: {custom.systemDirective}
                </p>

                <div className="mt-auto p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-500 block">
                    Permitted Scope Pattern: <code className="text-violet-600 dark:text-violet-400 font-semibold">{custom.permittedScope}</code>
                  </span>
                  {!isActive && (
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                      Status: Dormant (0 tokens consumed)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Agent Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Custom Autonomous Agent</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomAgent} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. DevOps Engineer, Security Auditor"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-950 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Agent Persona Name (Optional)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Liam Cross"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-950 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Permitted File Scope Pattern</label>
                <input
                  type="text"
                  required
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  placeholder="e.g. docker/**, .github/**, infra/**"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-950 dark:text-white placeholder:text-slate-400 font-mono focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">System Prompt Directive</label>
                <textarea
                  rows={2}
                  value={newDirective}
                  onChange={(e) => setNewDirective(e.target.value)}
                  placeholder="e.g. Audit infrastructure definitions, generate Dockerfiles and CI workflows."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-950 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 dark:hover:text-white cursor-pointer"
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

      {/* 5. Production Health & Live Deployment Footer */}
      {stage === 'merged' && deploymentState?.status === 'live' && (
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Feature Live in Production
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300/80">
                Domain active at {deploymentState.productionUrl} • Verified by QA Sentinel
              </p>
            </div>
          </div>
          <a
            href={deploymentState.productionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
          >
            <span>Open Live App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
