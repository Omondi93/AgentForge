import React from 'react';
import { Check, AlertTriangle, ShieldCheck, GitPullRequest, GitMerge, FileCode, CheckCircle2 } from 'lucide-react';
import { PlanningStage } from '../types/agentforge';

interface PipelineStepperProps {
  currentStage: PlanningStage;
  simulateCiFailure: boolean;
  onSelectStage?: (stage: PlanningStage) => void;
}

interface StepDefinition {
  id: number;
  stageKey: PlanningStage;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const STEPS: StepDefinition[] = [
  {
    id: 1,
    stageKey: 'requirements_approval',
    title: '1. Plan & Q&A',
    subtitle: 'Discovery & RFC Alignment',
    icon: FileCode,
  },
  {
    id: 2,
    stageKey: 'contract_freeze',
    title: '2. Frozen Contract',
    subtitle: 'Types & OpenAPI Lock',
    icon: ShieldCheck,
  },
  {
    id: 3,
    stageKey: 'executing',
    title: '3. Parallel Worker PRs',
    subtitle: 'Isolated File Scopes',
    icon: GitPullRequest,
  },
  {
    id: 4,
    stageKey: 'ci_waiting',
    title: '4. GitHub Actions CI',
    subtitle: 'Lint, TS & Contract Tests',
    icon: CheckCircle2,
  },
  {
    id: 5,
    stageKey: 'merged',
    title: '5. Human Review & Merge',
    subtitle: 'Triage & Production Sign-off',
    icon: GitMerge,
  },
];

function getStageIndex(stage: PlanningStage): number {
  switch (stage) {
    case 'discovery':
    case 'requirements_approval':
    case 'task_planning':
      return 1;
    case 'contract_freeze':
      return 2;
    case 'executing':
      return 3;
    case 'ci_waiting':
    case 'ci_failed':
      return 4;
    case 'merged':
      return 5;
    default:
      return 1;
  }
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  currentStage,
  simulateCiFailure,
  onSelectStage,
}) => {
  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800 px-6 py-3.5">
      <div className="flex items-center justify-between max-w-full overflow-x-auto gap-4 no-scrollbar">
        {STEPS.map((step, idx) => {
          const isCompleted = currentIndex > step.id || (currentIndex === 5 && step.id === 5 && currentStage === 'merged');
          const isCurrent = currentIndex === step.id;
          const isFailed = isCurrent && currentStage === 'ci_failed' && step.id === 4;
          const Icon = step.icon;

          let badgeBg = 'bg-slate-800 text-slate-400 border-slate-700';
          let titleColor = 'text-slate-400';

          if (isFailed) {
            badgeBg = 'bg-rose-500/20 text-rose-400 border-rose-500/50';
            titleColor = 'text-rose-300 font-semibold';
          } else if (isCurrent) {
            badgeBg = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
            titleColor = 'text-indigo-300 font-semibold';
          } else if (isCompleted) {
            badgeBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            titleColor = 'text-slate-300';
          }

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => onSelectStage && onSelectStage(step.stageKey)}
                className="flex items-center gap-3 text-left group shrink-0 focus:outline-none transition-transform active:scale-95"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-semibold font-mono transition-colors ${badgeBg}`}
                >
                  {isFailed ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ) : isCompleted ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span>0{step.id}</span>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className={`text-xs whitespace-nowrap tracking-tight transition-colors ${titleColor}`}>
                    {step.title}
                  </span>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap hidden sm:inline">
                    {isFailed ? 'CI Check Failed — Triage' : step.subtitle}
                  </span>
                </div>
              </button>

              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 min-w-[24px] h-[1px] transition-colors ${
                    currentIndex > step.id ? 'bg-emerald-500/40' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
