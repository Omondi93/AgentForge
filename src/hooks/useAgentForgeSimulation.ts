import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlanningStage,
  AgentPersona,
  WorkerTask,
  ContractSchema,
  ActivityEvent,
  PullRequestState,
  CIStepLog,
  PlanningQuestion,
  RequirementsBaseline,
  GitConfig,
  DeploymentState,
  DeploymentProvider,
  ArchitectChatMessage,
  TelemetryMetrics,
  ProjectSnapshot,
  VisualEditTarget,
  VisualEditPatch,
} from '../types/agentforge';
import { PRESET_FEATURES, INITIAL_ACTIVITY_LOGS } from '../data/presets';
import {
  generateClarificationQuestions,
  compileRequirementsBaseline,
  decomposeTasks,
  generateInterfaceContract,
} from '../services/leadArchitect';
import {
  getInitialChatMessages,
  getWelcomeChatMessage,
  sendLeadArchitectChatMessage,
  evaluateUserIntent,
} from '../services/leadArchitectChatService';
import {
  gitService,
  generateSpecializedWorkerCode,
  downloadProjectZip,
  pushToRemoteGitHub,
} from '../services/gitService';
import { ciRunner } from '../services/ciRunner';
import { deployService } from '../services/deployService';
import { auth } from '../lib/firebase';
import {
  saveProjectSnapshotToFirestore,
  fetchUserProjects,
  SavedProjectRecord,
} from '../services/projectStorageService';
import { loadAppSettings, getAgentEffectiveModelConfig, DEFAULT_PRIMARY_AI_PROVIDER } from '../services/settingsService';

export function useAgentForgeSimulation() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [featurePrompt, setFeaturePrompt] = useState<string>('');
  const [simulateCiFailure, setSimulateCiFailure] = useState<boolean>(false);
  const [stage, setStage] = useState<PlanningStage>('requirements_approval');
  const [currentGate, setCurrentGate] = useState<1 | 2 | 3 | 'completed'>(1);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [gitConfig, setGitConfig] = useState<GitConfig>(gitService.getConfig());
  const [savedProjectsCount, setSavedProjectsCount] = useState<number>(0);

  // Initialize saved projects count from Firestore / local cache on mount
  useEffect(() => {
    const userId = auth.currentUser?.uid || 'anonymous_architect';
    fetchUserProjects(userId)
      .then((list) => {
        setSavedProjectsCount(list.length);
      })
      .catch(() => {});
  }, []);

  // Initialize with categorized questions from Lead Architect
  const [questions, setQuestions] = useState<PlanningQuestion[]>([]);
  const [requirementsBaseline, setRequirementsBaseline] = useState<RequirementsBaseline | null>(null);

  const [contract, setContract] = useState<ContractSchema>(
    PRESET_FEATURES.auth.contract
  );
  const [tasks, setTasks] = useState<WorkerTask[]>(
    PRESET_FEATURES.auth.tasks
  );
  const [pullRequests, setPullRequests] = useState<Record<string, PullRequestState>>(() => {
    // Initialize PRs with diffViewed: true on initial load
    const initialPrs: Record<string, PullRequestState> = {};
    Object.entries(PRESET_FEATURES.auth.pullRequests).forEach(([branch, pr]) => {
      initialPrs[branch] = {
        ...pr,
        diffViewed: true,
      };
    });
    return initialPrs;
  });
  const [selectedBranch, setSelectedBranch] = useState<string>(
    'feature/backend-api-routes'
  );
  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    'app/api/auth/login/route.ts'
  );
  const [activeTab, setActiveTab] = useState<'diffs' | 'contract' | 'ci' | 'preview' | 'sandbox'>('preview');
  const [diffViewMode, setDiffViewMode] = useState<'unified' | 'split'>('unified');
  const [events, setEvents] = useState<ActivityEvent[]>(INITIAL_ACTIVITY_LOGS);
  const [filterPersona, setFilterPersona] = useState<AgentPersona | 'all' | 'system'>('all');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [autoScrollLogs, setAutoScrollLogs] = useState<boolean>(true);
  const [isAgentFixing, setIsAgentFixing] = useState<boolean>(false);
  const [deploymentState, setDeploymentState] = useState<DeploymentState>(deployService.getState());
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  // Lead Architect interactive chat state
  const [chatMessages, setChatMessages] = useState<ArchitectChatMessage[]>(() => [
    getWelcomeChatMessage(),
  ]);
  const [isSendingChatMessage, setIsSendingChatMessage] = useState<boolean>(false);

  const [confirmedDecisions, setConfirmedDecisions] = useState<string[]>(
    PRESET_FEATURES.auth.decisions
  );

  // ⚡ Live Token & Cost Telemetry Widget State
  const [telemetry, setTelemetry] = useState<TelemetryMetrics>({
    totalTokens: 14830,
    promptTokens: 9450,
    completionTokens: 5380,
    estimatedCost: 0.021,
    tokensSaved: 6200,
    breakdown: {
      lead: 5800,
      backend: 4200,
      frontend: 3100,
      qa: 1730,
      custom: 0,
    },
  });

  // 🕒 Time-Travel Snapshots List
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>(() => [
    {
      id: 'snap-baseline-0',
      name: 'v1.0.0 Architecture Baseline',
      timestamp: '12:00:00',
      description: 'Lead Architect initial discovery baseline with contracts structure',
      stage: 'requirements_approval',
      currentGate: 1,
      authorPersona: 'lead',
      fileCount: 4,
      files: {
        'contract.json': '{\n  "version": "v1.4.0",\n  "frozen": false\n}',
        'package.json': '{\n  "name": "agentforge-app",\n  "version": "1.0.0"\n}',
        'README.md': '# AgentForge Autonomous App\n',
      },
      contract: PRESET_FEATURES.auth.contract,
      tasks: PRESET_FEATURES.auth.tasks,
    },
  ]);

  // 🎨 Visual Edit Patches
  const [visualPatches, setVisualPatches] = useState<VisualEditPatch[]>([]);

  const addEvent = useCallback(
    (agent: AgentPersona | 'system' | 'webhook', message: string, metadata?: ActivityEvent['metadata']) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const newEvt: ActivityEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        agent,
        message,
        metadata,
      };
      setEvents((prev) => [...prev, newEvt]);
    },
    []
  );

  // Update Git configuration
  const updateGitConfig = (newConfig: Partial<GitConfig>) => {
    gitService.configure(newConfig);
    setGitConfig(gitService.getConfig());
    addEvent(
      'system',
      `Git Engine mode updated: ${
        newConfig.mode === 'live_github'
          ? 'Live GitHub Mode (Octokit active)'
          : 'Virtual Sandbox Mode (In-Memory database)'
      }`,
      { level: 'info' }
    );
  };

  const createSnapshot = useCallback(
    (name?: string, authorPersona: AgentPersona = 'lead') => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const virtualFiles = gitService.getVirtualFiles();
      const fileCount = Object.keys(virtualFiles).length;

      const newSnap: ProjectSnapshot = {
        id: `snap-${Date.now()}`,
        name: name || `Snapshot @ ${timeStr}`,
        timestamp: timeStr,
        description: `Virtual filesystem captured (${fileCount} files, contract ${contract.version})`,
        stage,
        currentGate,
        authorPersona,
        fileCount: fileCount || 4,
        files: { ...virtualFiles },
        contract: { ...contract },
        tasks: [...tasks],
      };

      setSnapshots((prev) => [newSnap, ...prev]);
      addEvent('system', `📸 Snapshot created: "${newSnap.name}"`, {
        level: 'info',
        step: 'snapshot',
      });
      return newSnap;
    },
    [contract, stage, currentGate, tasks, addEvent]
  );

  const rollbackToSnapshot = useCallback(
    (snapshotId: string) => {
      const target = snapshots.find((s) => s.id === snapshotId);
      if (!target) return;

      // Restore virtual files
      gitService.restoreVirtualFiles(target.files);
      // Restore contract
      setContract(target.contract);
      // Restore tasks
      setTasks(target.tasks);
      // Restore stage & currentGate
      setStage(target.stage);
      setCurrentGate(target.currentGate);

      addEvent(
        'system',
        `⏪ Time-travel rollback: Restored state to "${target.name}" (${target.timestamp}). Virtual filesystem & contract restored.`,
        {
          level: 'warn',
          step: 'rollback',
        }
      );
    },
    [snapshots, addEvent]
  );

  const handleDownloadZip = useCallback(async () => {
    try {
      const files = gitService.getVirtualFiles();
      if (Object.keys(files).length === 0) {
        const specialized = generateSpecializedWorkerCode(contract, selectedPresetId || 'auth');
        specialized.backendFiles.forEach((f) => gitService.setVirtualFile(f.path, f.content));
        specialized.frontendFiles.forEach((f) => gitService.setVirtualFile(f.path, f.content));
        specialized.qaFiles.forEach((f) => gitService.setVirtualFile(f.path, f.content));
      }
      const updatedFiles = gitService.getVirtualFiles();
      await downloadProjectZip(updatedFiles, contract, `agentforge-${selectedPresetId || 'app'}`);
      addEvent('system', `📦 ZIP Archive exported (${Object.keys(updatedFiles).length} files)`, {
        level: 'success',
      });
    } catch (err: any) {
      addEvent('system', `Failed to generate ZIP archive: ${err.message}`, { level: 'error' });
    }
  }, [contract, selectedPresetId, addEvent]);

  const handlePushToGitHub = useCallback(async () => {
    try {
      const settings = loadAppSettings();
      const files = gitService.getVirtualFiles();
      const branch = selectedBranch || 'feature/agentforge-auto';
      const result = await pushToRemoteGitHub(
        settings.githubToken,
        settings.defaultRepo?.split('/')[0] || 'agentforge-org',
        settings.defaultRepo?.split('/')[1] || 'agentforge-app',
        branch,
        `feat(orchestrator): Auto-generated feature for contract ${contract.version}`,
        files
      );
      addEvent('system', `🐙 GitHub Push: ${result.message}`, {
        level: 'success',
        branch,
      });
      alert(
        `GitHub Push Result:\n\n${result.message}\nPR Link: ${
          result.prUrl || 'https://github.com/agentforge-org/agentforge-app/pull/104'
        }`
      );
    } catch (err: any) {
      addEvent('system', `GitHub push failed: ${err.message}`, { level: 'error' });
    }
  }, [selectedBranch, contract, addEvent]);

  const handleCopyContract = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(contract, null, 2));
    addEvent(
      'system',
      `📋 Finalized contract JSON copied to clipboard (${contract.checksum.slice(0, 10)})`,
      {
        level: 'info',
      }
    );
  }, [contract, addEvent]);

  const handleVisualMicroEdit = useCallback(
    (target: VisualEditTarget, instruction: string) => {
      // 1. Update telemetry
      setTelemetry((prev) => {
        const pTokens = 220;
        const cTokens = 160;
        const added = pTokens + cTokens;
        return {
          ...prev,
          totalTokens: prev.totalTokens + added,
          promptTokens: prev.promptTokens + pTokens,
          completionTokens: prev.completionTokens + cTokens,
          estimatedCost: Number(
            (prev.estimatedCost + (pTokens * 0.1 + cTokens * 0.4) / 1000000).toFixed(4)
          ),
          breakdown: {
            ...prev.breakdown,
            frontend: prev.breakdown.frontend + added,
          },
        };
      });

      // 2. Add activity event
      addEvent(
        'frontend',
        `🎨 Visual Micro-Edit: Targeted task dispatched to Frontend Worker for <${target.componentName}>: "${instruction}"`,
        { level: 'info', file: `components/${target.componentName}.tsx` }
      );

      // 3. Briefly show frontend worker coding then merged
      setTasks((prev) =>
        prev.map((t) =>
          t.persona === 'frontend'
            ? {
                ...t,
                status: 'coding',
                currentAction: `Applying micro-edit to ${target.componentName}: ${instruction}`,
              }
            : t
        )
      );

      setTimeout(() => {
        setTasks((prev) =>
          prev.map((t) =>
            t.persona === 'frontend'
              ? {
                  ...t,
                  status: 'completed',
                  currentAction: `Merged visual patch into ${target.componentName}`,
                }
              : t
          )
        );

        // Update virtual file system with patch
        const componentPath = `components/${target.componentName}.tsx`;
        const existing = gitService.getVirtualFiles()[componentPath] || '';
        gitService.setVirtualFile(
          componentPath,
          existing +
            `\n// Visual patch applied at ${new Date().toLocaleTimeString()}: ${instruction}\n`
        );

        // Create snapshot
        createSnapshot(`Visual Edit: ${target.componentName}`, 'frontend');

        addEvent(
          'frontend',
          `✅ Micro-edit patch successfully merged for <${target.componentName}> without breaking contract.`,
          { level: 'success', file: componentPath }
        );
      }, 700);
    },
    [addEvent, createSnapshot]
  );

  // Switch preset
  const selectPreset = (presetId: string) => {
    const preset = PRESET_FEATURES[presetId];
    if (!preset) return;
    setSelectedPresetId(presetId);
    setFeaturePrompt(preset.prompt);
    setConfirmedDecisions(preset.decisions);
    setSimulateCiFailure(preset.defaultCiFailure);

    // Reset into Gate 1 discovery for the new preset
    setCurrentGate(1);
    setStage('requirements_approval');
    setActiveTab('preview');
    setDeploymentState(deployService.getState());

    // 5. Move Presets: populate as the first message sent by the user in this unified chat
    const userMsg: ArchitectChatMessage = {
      id: `msg-user-preset-${Date.now()}`,
      sender: 'user',
      content: preset.prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const leadInitMsgs = getInitialChatMessages(preset.prompt);
    const leadMsg: ArchitectChatMessage = {
      ...leadInitMsgs[0],
      id: `msg-lead-preset-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => {
      const welcome = prev.find((m) => m.id.startsWith('msg-welcome')) || getWelcomeChatMessage();
      return [welcome, userMsg, leadMsg];
    });

    // Create unfrozen draft contract
    const draftContract: ContractSchema = {
      ...preset.contract,
      frozen: false,
    };
    setContract(draftContract);

    // Set tasks to blocked until Gate 3
    const blockedTasks: WorkerTask[] = preset.tasks.map((t) => ({
      ...t,
      status: t.persona === 'lead' ? 'awaiting_decision' : 'blocked_contract',
      currentAction:
        t.persona === 'lead'
          ? 'Conducting requirements discovery & contract draft'
          : 'Blocked: Awaiting Gate 3 contract approval before coding',
    }));
    setTasks(blockedTasks);

    // Populate PRs with diffViewed initialized
    const nextPrs: Record<string, PullRequestState> = {};
    Object.entries(preset.pullRequests).forEach(([branch, pr]) => {
      nextPrs[branch] = {
        ...pr,
        diffViewed: true,
      };
    });
    setPullRequests(nextPrs);

    const firstBranch = Object.keys(preset.pullRequests)[0];
    if (firstBranch) {
      setSelectedBranch(firstBranch);
      const firstFile = preset.pullRequests[firstBranch]?.diffs[0]?.path;
      if (firstFile) setSelectedFilePath(firstFile);
    }

    generateClarificationQuestions(preset.prompt).then((newQs) => {
      setQuestions(newQs);
      setRequirementsBaseline(null);
    });

    addEvent('lead', `Preset "${preset.name}" populated into Unified Architect Chat. Initiated Gate 1 discovery.`, {
      level: 'info',
    });
  };

  // Analyze arbitrary prompt with Gemini / Local Fallback
  const analyzePrompt = async (customPrompt: string) => {
    setIsGeneratingQuestions(true);
    addEvent('lead', `Lead Architect analyzing feature request: "${customPrompt.slice(0, 80)}..."`, {
      level: 'info',
    });

    try {
      const generatedQs = await generateClarificationQuestions(customPrompt);
      setQuestions(generatedQs);
      setCurrentGate(1);
      setStage('requirements_approval');
      setRequirementsBaseline(null);

      // Reset contract to unfrozen
      const draft = generateInterfaceContract(customPrompt, {} as any);
      setContract(draft);
      setChatMessages(getInitialChatMessages(customPrompt));

      // Set tasks to blocked
      const blocked = decomposeTasks({} as any, draft.version, selectedPresetId);
      setTasks(blocked);

      addEvent('lead', `Generated ${generatedQs.length} architectural clarification questions across 3 priority tiers.`, {
        level: 'success',
      });
    } catch (_err) {
      addEvent('lead', 'Falling back to local architectural dictionary.', { level: 'warn' });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Toggle simulate CI failure using CIRunner
  const handleToggleCiFailure = async (enable: boolean) => {
    setSimulateCiFailure(enable);
    const targetBranch = Object.keys(pullRequests).find((k) => k.includes('backend')) || selectedBranch;

    if (enable) {
      const ciResult = await ciRunner.executePipeline(targetBranch, 'backend', true, 0);

      setPullRequests((prev) => {
        const next = { ...prev };
        if (next[targetBranch]) {
          next[targetBranch] = {
            ...next[targetBranch],
            ciStatus: ciResult.ciStatus,
            ciLogs: ciResult.ciLogs,
            diagnostic: ciResult.diagnostic,
          };
        }
        return next;
      });

      setStage('ci_failed');
      setActiveTab('ci'); // Focus on CI tab to display diagnostic card

      addEvent(
        'webhook',
        "GitHub Actions check failure detected in tsc --noEmit: Type 'string' is not assignable to type 'UserRole' in app/api/auth/login/route.ts:42. Lead Architect automated diagnosis triggered.",
        { level: 'error', branch: targetBranch }
      );
    } else {
      const ciResult = await ciRunner.executePipeline(targetBranch, 'backend', false, 0);

      setPullRequests((prev) => {
        const next = { ...prev };
        if (next[targetBranch]) {
          next[targetBranch] = {
            ...next[targetBranch],
            ciStatus: ciResult.ciStatus,
            ciLogs: ciResult.ciLogs,
            diagnostic: undefined,
          };
        }
        return next;
      });

      setStage('ci_waiting');
      addEvent('system', 'Simulated CI failure disabled. Restored nominal pipeline state.', { level: 'info' });
    }
  };

  // Toggle simulate Scope Violation (Automated Boundary Guard Test)
  const toggleScopeViolation = () => {
    const backendBranch = Object.keys(pullRequests).find((k) => k.includes('backend')) || selectedBranch;
    const currentPr = pullRequests[backendBranch];
    if (!currentPr) return;

    const hasViolationAlready =
      (currentPr.scopeViolations && currentPr.scopeViolations.length > 0) ||
      !currentPr.isScopeCompliant ||
      currentPr.diffs.some((d) => d.isScopeViolation);

    if (!hasViolationAlready) {
      // Restrict backend task back to legacy boundaries without app/api/**/*
      setTasks((prev) =>
        prev.map((t) =>
          t.persona === 'backend'
            ? {
                ...t,
                permittedFiles: ['src/server/auth.ts', 'src/middleware/session.ts', 'src/routes/auth.ts'],
              }
            : t
        )
      );

      const violations = [
        {
          path: 'app/api/auth/login/route.ts',
          workerPersona: 'backend' as const,
          permittedFiles: ['src/server/auth.ts', 'src/middleware/session.ts', 'src/routes/auth.ts'],
          reason: 'File "app/api/auth/login/route.ts" is outside worker permitted file scopes (src/server/auth.ts, src/middleware/session.ts, src/routes/auth.ts)',
        },
      ];

      const updatedDiffs = currentPr.diffs.map((d) =>
        d.path === 'app/api/auth/login/route.ts' ? { ...d, isScopeViolation: true } : d
      );

      setPullRequests((prev) => ({
        ...prev,
        [backendBranch]: {
          ...currentPr,
          diffs: updatedDiffs,
          scopeViolations: violations,
          isScopeCompliant: false,
        },
      }));
      setSelectedBranch(backendBranch);
      setSelectedFilePath('app/api/auth/login/route.ts');
      setActiveTab('diffs');

      addEvent(
        'system',
        'Automated Scope Violation detected on branch feature/backend-api-routes: file "app/api/auth/login/route.ts" is outside permitted boundaries!',
        { level: 'error', branch: backendBranch }
      );
    } else {
      // Resolve violation and restore permission
      setTasks((prev) =>
        prev.map((t) =>
          t.persona === 'backend'
            ? {
                ...t,
                permittedFiles: Array.from(
                  new Set([
                    ...t.permittedFiles,
                    'app/api/**/*',
                    'src/server/**/*',
                    'app/api/auth/login/route.ts',
                  ])
                ),
              }
            : t
        )
      );

      const cleanedDiffs = currentPr.diffs
        .filter((d) => d.path !== 'components/auth/LoginForm.tsx')
        .map((d) => ({ ...d, isScopeViolation: false }));

      setPullRequests((prev) => ({
        ...prev,
        [backendBranch]: {
          ...currentPr,
          diffs: cleanedDiffs,
          scopeViolations: [],
          isScopeCompliant: true,
        },
      }));

      addEvent(
        'system',
        'Scope violation resolved: permitted boundaries restored to include app/api/auth/login/route.ts.',
        { level: 'info', branch: backendBranch }
      );
    }
  };

  // Mark diff viewed when inspecting diffs
  const markDiffViewed = useCallback((branch = selectedBranch) => {
    setPullRequests((prev) => {
      const next = { ...prev };
      if (next[branch] && !next[branch].diffViewed) {
        next[branch] = {
          ...next[branch],
          diffViewed: true,
        };
      }
      return next;
    });
  }, [selectedBranch]);

  // Select an option within a question
  const selectQuestionOption = (questionId: string, optionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const selected = q.options.find((o) => o.id === optionId);
          return {
            ...q,
            selectedOptionId: optionId,
            userAnswer: selected?.label || q.suggestedAnswer,
            isCustom: false,
            status: 'confirmed',
          };
        }
        return q;
      })
    );
  };

  // Set custom answer for a question
  const setQuestionCustomAnswer = (questionId: string, customText: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            customAnswer: customText,
            userAnswer: customText,
            isCustom: true,
            status: customText.trim() ? 'confirmed' : 'pending',
          };
        }
        return q;
      })
    );
  };

  // Gate 1 & 2 Completion: Compile Requirements Baseline & Decompose Tasks
  const compileBaselineAndDecompose = () => {
    const baseline = compileRequirementsBaseline(featurePrompt, questions, confirmedDecisions);
    setRequirementsBaseline(baseline);

    const isolatedTasks = decomposeTasks(baseline, contract.version, selectedPresetId);
    setTasks(isolatedTasks);

    const generatedContract = generateInterfaceContract(featurePrompt, baseline, contract.version);
    setContract(generatedContract);

    setCurrentGate(3);
    setStage('contract_freeze');
    setActiveTab('contract');

    addEvent(
      'lead',
      `Gate 1 Passed: Requirements Baseline compiled with ${baseline.functionalRequirements.length} functional requirements & ${baseline.acceptanceCriteria.length} acceptance criteria.`,
      { level: 'success' }
    );
    addEvent(
      'lead',
      'Gate 2 Passed: Decomposed into 3 isolated worker branches with strict file boundaries. Workers held in blocked state pending Gate 3.',
      { level: 'info' }
    );
    addEvent(
      'lead',
      'Gate 3 Open: Interface contract generated at types/contracts.ts. Awaiting user "Approve & Freeze Contract" command.',
      { level: 'warn' }
    );
  };

  // Gate 3 Approval & Specialized Worker Pipeline Execution
  const approveAndFreezeContract = async () => {
    const frozenContract: ContractSchema = {
      ...contract,
      frozen: true,
      frozenAt: new Date().toISOString(),
    };
    setContract(frozenContract);
    setCurrentGate('completed');
    setStage('executing');

    const { backendFiles, frontendFiles, qaFiles } = generateSpecializedWorkerCode(
      frozenContract,
      selectedPresetId
    );

    const backendBranch = 'feature/backend-api-routes';
    const frontendBranch = 'feature/frontend-ui-components';
    const qaBranch = 'feature/qa-vitest-suite';

    const backendTask = tasks.find((t) => t.persona === 'backend');
    const frontendTask = tasks.find((t) => t.persona === 'frontend');
    const qaTask = tasks.find((t) => t.persona === 'qa');

    // Fleet Execution Guard: Filter execution to Active agents only.
    // Dormant agents are completely excluded from dispatches, API calls, and Git branch creations.
    let fleetState: Record<string, boolean> = { backend: true, frontend: true, qa: true };
    try {
      const savedFleet = localStorage.getItem('agentforge_fleet_state');
      if (savedFleet) {
        fleetState = { ...fleetState, ...JSON.parse(savedFleet) };
      }
    } catch {
      // default
    }

    const isBackendActive = fleetState.backend !== false;
    const isFrontendActive = fleetState.frontend !== false;
    const isQaActive = fleetState.qa !== false;

    const prMap: Record<string, any> = {};
    let initialBranch = '';

    if (isBackendActive) {
      await gitService.createBranch(backendBranch);
      const bCommit = await gitService.commitFiles(
        backendBranch,
        backendFiles,
        'feat(backend): Next.js App Router handlers typed to frozen DTOs',
        'Backend Worker'
      );
      const bPr = await gitService.createPullRequest(
        'feat(backend): Next.js App Router routes & session middleware',
        backendBranch,
        'backend',
        backendTask?.permittedFiles || ['app/api/auth/*'],
        bCommit.diffs
      );
      bPr.diffViewed = true;
      prMap[backendBranch] = bPr;
      initialBranch = backendBranch;
    }

    if (isFrontendActive) {
      await gitService.createBranch(frontendBranch);
      const fCommit = await gitService.commitFiles(
        frontendBranch,
        frontendFiles,
        'feat(frontend): React components strictly consuming frozen props',
        'Frontend Worker'
      );
      const fPr = await gitService.createPullRequest(
        'feat(frontend): LoginForm and SessionBadge components',
        frontendBranch,
        'frontend',
        frontendTask?.permittedFiles || ['components/auth/*', 'app/login/*'],
        fCommit.diffs
      );
      fPr.diffViewed = true;
      prMap[frontendBranch] = fPr;
      if (!initialBranch) initialBranch = frontendBranch;
    }

    if (isQaActive) {
      await gitService.createBranch(qaBranch);
      const qCommit = await gitService.commitFiles(
        qaBranch,
        qaFiles,
        'test(qa): Vitest schema conformance & component validation',
        'QA Worker'
      );
      const qPr = await gitService.createPullRequest(
        'test(qa): Vitest contract schema conformance suite',
        qaBranch,
        'qa',
        qaTask?.permittedFiles || ['tests/api/*', 'tests/components/*'],
        qCommit.diffs
      );
      qPr.diffViewed = true;
      prMap[qaBranch] = qPr;
      if (!initialBranch) initialBranch = qaBranch;
    }

    setPullRequests(prMap);
    if (initialBranch) {
      setSelectedBranch(initialBranch);
      if (initialBranch === backendBranch) {
        setSelectedFilePath(backendFiles[0]?.path || '');
      } else if (initialBranch === frontendBranch) {
        setSelectedFilePath(frontendFiles[0]?.path || '');
      } else if (initialBranch === qaBranch) {
        setSelectedFilePath(qaFiles[0]?.path || '');
      }
      setActiveTab('diffs');
    }

    // Update token & cost telemetry
    let addedTokens = 0;
    let bTokens = 0;
    let fTokens = 0;
    let qTokens = 0;
    let dormantSaved = 0;

    if (isBackendActive) {
      bTokens = 3800;
      addedTokens += bTokens;
    } else {
      dormantSaved += 3800;
    }

    if (isFrontendActive) {
      fTokens = 3200;
      addedTokens += fTokens;
    } else {
      dormantSaved += 3200;
    }

    if (isQaActive) {
      qTokens = 1800;
      addedTokens += qTokens;
    } else {
      dormantSaved += 1800;
    }

    setTelemetry((prev) => {
      const pTokens = Math.round(addedTokens * 0.65);
      const cTokens = Math.round(addedTokens * 0.35);
      return {
        ...prev,
        totalTokens: prev.totalTokens + addedTokens,
        promptTokens: prev.promptTokens + pTokens,
        completionTokens: prev.completionTokens + cTokens,
        estimatedCost: Number(
          (prev.estimatedCost + (pTokens * 0.1 + cTokens * 0.4) / 1000000).toFixed(4)
        ),
        tokensSaved: prev.tokensSaved + dormantSaved,
        breakdown: {
          ...prev.breakdown,
          backend: prev.breakdown.backend + bTokens,
          frontend: prev.breakdown.frontend + fTokens,
          qa: prev.breakdown.qa + qTokens,
        },
      };
    });

    createSnapshot(`Gate 3: Contract Frozen (${frozenContract.version})`, 'lead');

    const appSettings = loadAppSettings();
    const globalAi = appSettings.primaryAiProvider || DEFAULT_PRIMARY_AI_PROVIDER;
    const effectiveModel = getAgentEffectiveModelConfig('lead', globalAi);
    const maskedKey = globalAi.apiKey
      ? `key: ***${globalAi.apiKey.slice(-4)}`
      : 'platform managed key';

    setTasks((prev) =>
      prev.map((t) => {
        if (t.persona === 'lead') {
          return {
            ...t,
            status: 'completed',
            progressPercent: 100,
            currentAction: `Contract frozen; orchestrated via ${globalAi.provider}/${globalAi.model}`,
            modelConfig: effectiveModel,
          };
        }
        const isWorkerActive = fleetState[t.persona] !== false;
        if (!isWorkerActive) {
          return {
            ...t,
            status: 'idle',
            progressPercent: 0,
            currentAction: 'Dormant (0 tokens consumed) — worker excluded by fleet policy',
            modelConfig: effectiveModel,
          };
        }
        return {
          ...t,
          status: 'coding',
          progressPercent: 75,
          currentAction: `Checked out branch ${t.branch}; executing via ${globalAi.provider}/${globalAi.model} [${maskedKey}]`,
          modelConfig: effectiveModel,
        };
      })
    );

    const activeCount = [isBackendActive, isFrontendActive, isQaActive].filter(Boolean).length;
    addEvent(
      'lead',
      `Gate 3 Approved: Interface contract ${frozenContract.version} frozen with SHA256 checksum ${frozenContract.checksum} [Engine: ${globalAi.provider}:${globalAi.model}]. Fleet execution dispatched ${activeCount} active workers.`,
      { level: 'success', model: globalAi.model, provider: globalAi.provider }
    );
    addEvent(
      'system',
      `[MicroVM Engine] Provisioned 3 hardware-isolated Firecracker microVMs (Dedicated Linux 6.1.102-microvm-fc3, KVM). Hard memory ceiling 1024MB, 120s timeout watchdog armed.`,
      { level: 'info' }
    );
    addEvent(
      'system',
      `[Zero-Trust Egress] Default-Deny active. Outbound traffic to 169.254.169.254 (Cloud Metadata) and RFC 1918 subnets blocked. Domain whitelist enforced.`,
      { level: 'info' }
    );
    addEvent(
      'system',
      `[Secret Proxy] GitHub PAT dynamic injection enabled. 0 ambient credentials stored in microVM environment variables.`,
      { level: 'info' }
    );

    if (isBackendActive) {
      addEvent(
        'backend',
        `Backend Worker dispatched on branch ${backendBranch} [${globalAi.provider}:${globalAi.model}] with global key injected. Generated ${backendFiles.length} Next.js route handlers.`,
        { branch: backendBranch, level: 'info', model: globalAi.model, provider: globalAi.provider }
      );
    } else {
      addEvent(
        'backend',
        `Backend Worker is Dormant (0 tokens consumed). Excluded from execution dispatches.`,
        { level: 'warn' }
      );
    }

    if (isFrontendActive) {
      addEvent(
        'frontend',
        `Frontend Worker dispatched on branch ${frontendBranch} [${globalAi.provider}:${globalAi.model}] with global key injected. Generated ${frontendFiles.length} React components.`,
        { branch: frontendBranch, level: 'info', model: globalAi.model, provider: globalAi.provider }
      );
    } else {
      addEvent(
        'frontend',
        `Frontend Worker is Dormant (0 tokens consumed). Excluded from execution dispatches.`,
        { level: 'warn' }
      );
    }

    if (isQaActive) {
      addEvent(
        'qa',
        `QA Worker dispatched on branch ${qaBranch} [${globalAi.provider}:${globalAi.model}] with global key injected. Generated ${qaFiles.length} Vitest contract conformance specs.`,
        { branch: qaBranch, level: 'info', model: globalAi.model, provider: globalAi.provider }
      );
    } else {
      addEvent(
        'qa',
        `QA Worker is Dormant (0 tokens consumed). Excluded from execution dispatches.`,
        { level: 'warn' }
      );
    }

    setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.persona === 'lead') return t;
          const isWorkerActive = fleetState[t.persona] !== false;
          if (!isWorkerActive) return t;
          return {
            ...t,
            status: 'awaiting_ci',
            progressPercent: 100,
            currentAction: 'PR opened, waiting on CI',
          };
        })
      );
      setStage('ci_waiting');
      addEvent('webhook', 'GitHub Actions CI triggered for parallel PRs. Running lint, typecheck & vitest suites.', {
        level: 'info',
      });
    }, 2500);
  };

  // 1-Click Auto-Repair & Bounded Lead Agent Triage:
  // Acknowledges scope mismatch, updates permitted boundaries to include app/api/auth/login/route.ts,
  // app/api/**/* and src/server/**/ and re-runs CI checks so the PR turns green and can be merged.
  const applyAgentFix = () => {
    const backendBranch = Object.keys(pullRequests).find((k) => k.includes('backend')) || selectedBranch;
    const targetBranch = pullRequests[selectedBranch] ? selectedBranch : backendBranch;
    const currentPr = pullRequests[targetBranch];
    if (!currentPr) return;

    setIsAgentFixing(true);

    const hasScopeMismatch =
      Boolean(currentPr.scopeViolations && currentPr.scopeViolations.length > 0) ||
      !currentPr.isScopeCompliant ||
      currentPr.diffs.some((d) => d.isScopeViolation);

    if (hasScopeMismatch) {
      addEvent(
        'lead',
        `Lead Architect acknowledging scope mismatch on ${targetBranch}: Backend Worker correctly generated Next.js App Router endpoint "app/api/auth/login/route.ts", but task permitted scope was restricted to legacy boundaries. Initiating 1-Click Auto-Repair.`,
        { level: 'warn', branch: targetBranch }
      );
    } else {
      addEvent(
        'lead',
        `Lead Architect applying bounded triage fix for ${targetBranch}: enforcing contract type invariant.`,
        { level: 'warn', branch: targetBranch }
      );
    }

    setTimeout(() => {
      // 1. Update task boundaries: Officially permit app/api/**/*, src/server/**/* and app/api/auth/login/route.ts
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (t.persona === 'backend' || t.branch === targetBranch) {
            const updatedPermitted = Array.from(
              new Set([
                ...t.permittedFiles,
                'app/api/**/*',
                'src/server/**/*',
                'app/api/auth/login/route.ts',
                'app/api/auth/session/route.ts',
              ])
            );
            return {
              ...t,
              permittedFiles: updatedPermitted,
              status: t.status === 'blocked_contract' ? 'blocked_contract' : 'coding',
              currentAction: 'Boundaries updated by Lead Architect: authorized for app/api/**/* and src/server/**/*',
            };
          }
          return t;
        })
      );

      // 2. Clean diffs and clear scope violations
      const updatedDiffs = currentPr.diffs
        .filter((d) => d.path !== 'components/auth/LoginForm.tsx')
        .map((d) => ({
          ...d,
          isScopeViolation: false,
        }));

      let updatedPr: PullRequestState = {
        ...currentPr,
        diffs: updatedDiffs,
        scopeViolations: [],
        isScopeCompliant: true,
        diffViewed: true,
      };

      // 3. Handle CI diagnostic fix if present
      if (currentPr.diagnostic) {
        const triageResult = ciRunner.applyTriageFix(updatedPr, false);
        if (triageResult.success) {
          updatedPr = {
            ...triageResult.updatedPr,
            diffs: triageResult.updatedPr.diffs.map((d) => ({ ...d, isScopeViolation: false })),
            scopeViolations: [],
            isScopeCompliant: true,
            diffViewed: true,
          };
        }
      }

      // 4. Re-run CI pipeline checks to ensure green status across lint, tsc, and vitest
      updatedPr.ciStatus = 'success';
      updatedPr.diagnostic = undefined;
      updatedPr.ciLogs = [
        {
          id: 'step-1',
          name: 'Lint & Formatting Checks',
          command: 'npm run lint',
          status: 'success',
          durationMs: 780,
          logs: [
            '> eslint app/api/auth/login/route.ts src/server/auth.ts src/middleware/session.ts',
            '✔ Scope Boundary Guard: app/api/auth/login/route.ts officially authorized within task scope.',
            '✔ 0 ESLint warnings or errors detected in Next.js App Router endpoints.',
          ],
        },
        {
          id: 'step-2',
          name: 'TypeScript Contract Verification',
          command: 'tsc --noEmit',
          status: 'success',
          durationMs: 1350,
          logs: [
            '> tsc --noEmit',
            'Checking app/api/auth/login/route.ts against Frozen Contract v1.4.0...',
            '✔ POST /api/auth/login implements LoginPayload and AuthSessionResponse matching contract.',
            '✔ All TypeScript types and error envelopes verified with 0 errors.',
            'Compilation complete with 0 errors.',
          ],
        },
        {
          id: 'step-3',
          name: 'Automated Test Suite',
          command: 'npm run test',
          status: 'success',
          durationMs: 2240,
          logs: [
            '> vitest run tests/api/auth.test.ts',
            'PASS tests/api/auth.test.ts (1.35s)',
            '  ✓ POST /api/auth/login boundary and payload verification passed',
            '  ✓ Session token cookies configured with httpOnly and sameSite',
            '  ✓ Contract schema conformity verified',
            'Test Suites: 1 passed, 1 total',
            'Tests:       3 passed, 3 total',
          ],
        },
      ];

      setPullRequests((prev) => ({
        ...prev,
        [targetBranch]: updatedPr,
        ...(prev['feat/auth-backend-endpoints'] ? { ['feat/auth-backend-endpoints']: updatedPr } : {}),
      }));

      setSelectedFilePath('app/api/auth/login/route.ts');
      setSimulateCiFailure(false);
      setStage('executing');
      setIsAgentFixing(false);

      addEvent(
        'lead',
        `1-Click Auto-Repair Complete: Permitted boundaries officially expanded to include app/api/auth/login/route.ts, app/api/**/* and src/server/**/* for Backend Worker.`,
        { level: 'success', branch: targetBranch }
      );
      addEvent(
        'webhook',
        `GitHub Actions CI re-run green across Lint, TypeScript Contract Verification, and Vitest test suites. Pull Request #${updatedPr.id.replace('PR-', '') || '104'} is 100% green and ready to merge!`,
        { level: 'success', branch: targetBranch }
      );
    }, 1200);
  };

  // Manual Override Fix Handler
  const applyManualOverride = (overrideNote: string) => {
    const currentPr = pullRequests[selectedBranch];
    if (!currentPr) return;

    setIsAgentFixing(true);
    addEvent(
      'system',
      `Manual Override initiated by Reviewer: "${overrideNote}". Bypassing automated revision limits.`,
      { level: 'warn' }
    );

    setTimeout(() => {
      const triageResult = ciRunner.applyTriageFix(currentPr, true, overrideNote);
      setPullRequests((prev) => ({
        ...prev,
        [selectedBranch]: triageResult.updatedPr,
      }));

      setSimulateCiFailure(false);
      setStage('executing');
      setIsAgentFixing(false);

      addEvent(
        'system',
        `Manual override committed (commit ${triageResult.updatedPr.headSha}). Branch verified green.`,
        { level: 'success', branch: selectedBranch }
      );
    }, 1000);
  };

  // Approve & Merge PR
  const approveAndMerge = () => {
    const activePr = pullRequests[selectedBranch];
    if (activePr?.scopeViolations && activePr.scopeViolations.length > 0) {
      addEvent(
        'system',
        `Merge rejected: Branch ${selectedBranch} contains unresolved file scope violations.`,
        { level: 'error' }
      );
      return;
    }

    if (activePr?.ciStatus !== 'success') {
      addEvent('system', `Merge rejected: Branch ${selectedBranch} has failing or pending CI checks.`, {
        level: 'error',
      });
      return;
    }

    setStage('merged');
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        status: 'completed',
        progressPercent: 100,
        currentAction: 'Merged into main branch',
      }))
    );
    setPullRequests((prev) => {
      const next: Record<string, PullRequestState> = {};
      Object.entries(prev).forEach(([branch, pr]) => {
        next[branch] = {
          ...pr,
          reviewStatus: 'merged',
        };
      });
      return next;
    });

    addEvent(
      'system',
      `Human Reviewer signed off and approved merge. PR ${activePr?.id || '#104'} squashed into main branch at commit d891a20.`,
      { level: 'success' }
    );
    addEvent(
      'lead',
      'Orchestration complete: Pipeline Stage 5 Complete. Production ready.',
      { level: 'success' }
    );
    // Auto-switch to Live App Preview upon merge
    setActiveTab('preview');
    addEvent(
      'system',
      '[DEPLOY] Feature successfully merged into main (d891a20). Switched to Live App Preview. Ready for one-click production release.',
      { level: 'info' }
    );

    // Auto-save project state to Firestore /projects collection on reaching Stage 5 (Published Live)
    saveCurrentProjectSnapshot();
    createSnapshot('Stage 5: PRs Merged to Main', 'lead');
  };

  // One-Click Production Deployment
  const deployToProduction = async (provider: DeploymentProvider = 'vercel') => {
    if (isDeploying) return;
    setIsDeploying(true);
    addEvent(
      'system',
      `[DEPLOY] Triggered production build for commit d891a20 on ${provider === 'vercel' ? 'Vercel Edge Network' : 'Cloudflare Workers'}...`,
      { level: 'info' }
    );

    try {
      const result = await deployService.deploy('d891a20', provider, (state, logLine) => {
        setDeploymentState({ ...state });
        addEvent('webhook', logLine, {
          level: state.status === 'live' ? 'success' : 'info',
        });
      });
      setDeploymentState(result);
      setActiveTab('preview');
      addEvent(
        'system',
        `[DEPLOY] Assigned live production domain: ${result.productionUrl} (Build duration: ${(result.durationMs! / 1000).toFixed(2)}s). Production: Live.`,
        { level: 'success' }
      );

      // Auto-save project state to Firestore /projects collection on reaching Stage 5 (Published Live)
      if (result.status === 'live') {
        await saveCurrentProjectSnapshot();
      }
    } finally {
      setIsDeploying(false);
    }
  };

  // Save current project state to Firestore /projects collection
  const saveCurrentProjectSnapshot = async (customName?: string) => {
    const userId = auth.currentUser?.uid || 'anonymous_architect';
    const frontendWorker = tasks.find((t) => t.persona === 'frontend');
    const projectId = `proj-${Date.now()}`;
    const projectName =
      customName ||
      (featurePrompt
        ? featurePrompt.slice(0, 50)
        : selectedPresetId === 'calculator'
        ? 'Modern Calculator UI'
        : selectedPresetId === 'stripe'
        ? 'Stripe Checkout & Billing'
        : selectedPresetId === 'rbac'
        ? 'Team RBAC Permissions'
        : 'User Auth & Sessions');

    const snapshotRecord: SavedProjectRecord = {
      id: projectId,
      ownerId: userId,
      name: projectName,
      featurePrompt: featurePrompt || PRESET_FEATURES.auth.prompt,
      stage: 'merged',
      contractVersion: contract.version,
      isContractFrozen: contract.frozen,
      requirementsBaselineJson: requirementsBaseline ? JSON.stringify(requirementsBaseline) : undefined,
      contractJson: JSON.stringify(contract),
      chatMessagesJson: JSON.stringify(chatMessages),
      componentReferences: JSON.stringify(frontendWorker?.permittedFiles || ['src/components/App.tsx']),
      productionUrl: deploymentState.productionUrl || 'https://agentforge-demo.vercel.app',
      selectedPresetId: selectedPresetId || 'auth',
      createdAt: new Date().toISOString(),
    };

    const res = await saveProjectSnapshotToFirestore(snapshotRecord);
    if (res.success) {
      addEvent(
        'system',
        `[FIRESTORE] Stage 5 project snapshot "${projectName}" saved to /projects/${projectId}. State, contract, and components archived.`,
        { level: 'success' }
      );
      setSavedProjectsCount((prev) => prev + 1);
    }
  };

  // Load project snapshot from Firestore and restore Live Preview & Chat History
  const loadSavedProject = (saved: SavedProjectRecord) => {
    try {
      if (saved.featurePrompt) {
        setFeaturePrompt(saved.featurePrompt);
      }
      if (saved.selectedPresetId) {
        setSelectedPresetId(saved.selectedPresetId);
      }
      setStage('merged');
      setCurrentGate('completed');
      setDeploymentState({
        status: 'live',
        productionUrl: saved.productionUrl || 'https://agentforge-demo.vercel.app',
        commitSha: 'd891a20',
        provider: 'vercel',
        buildLogs: [
          'Restored from saved project snapshot',
          `Deployed production build at ${saved.productionUrl || 'https://agentforge-demo.vercel.app'}`,
        ],
        deployedAt: saved.createdAt,
      });

      if (saved.requirementsBaselineJson) {
        try {
          const parsed = JSON.parse(saved.requirementsBaselineJson);
          setRequirementsBaseline(parsed);
        } catch {}
      }

      if (saved.contractJson) {
        try {
          const parsedContract = JSON.parse(saved.contractJson);
          setContract({ ...parsedContract, frozen: true });
        } catch {}
      }

      if (saved.chatMessagesJson) {
        try {
          const parsedMsgs = JSON.parse(saved.chatMessagesJson);
          if (Array.isArray(parsedMsgs) && parsedMsgs.length > 0) {
            setChatMessages(parsedMsgs);
          }
        } catch {}
      }

      let permittedFiles = ['src/components/App.tsx'];
      if (saved.componentReferences) {
        try {
          permittedFiles = JSON.parse(saved.componentReferences);
        } catch {}
      }

      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          status: 'completed',
          progressPercent: 100,
          currentAction: 'Restored from saved project snapshot',
          permittedFiles: t.persona === 'frontend' ? permittedFiles : t.permittedFiles,
        }))
      );

      setActiveTab('preview');
      addEvent(
        'system',
        `[FIRESTORE] Project "${saved.name}" restored from /projects/${saved.id}. Live App Preview and Chat History reloaded.`,
        { level: 'success' }
      );
    } catch (err: any) {
      console.error('Failed to load project:', err);
    }
  };

  // Reject Branch
  const rejectBranch = (reason = 'Revision required to adhere to architectural boundaries') => {
    addEvent('system', `Human Reviewer rejected branch ${selectedBranch}: ${reason}`, { level: 'warn' });
    setPullRequests((prev) => {
      const next = { ...prev };
      if (next[selectedBranch]) {
        next[selectedBranch] = {
          ...next[selectedBranch],
          reviewStatus: 'rejected',
        };
      }
      return next;
    });
    setTasks((prev) =>
      prev.map((t) => (t.branch === selectedBranch ? { ...t, status: 'drafting', currentAction: 'Revising based on rejection' } : t))
    );
  };

  // Run full simulation from start
  const runFullSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setCurrentGate(1);
    setStage('discovery');

    addEvent('system', 'Restarting multi-agent orchestration lifecycle from Discovery phase.', { level: 'info' });

    setTimeout(() => {
      compileBaselineAndDecompose();

      setTimeout(() => {
        approveAndFreezeContract();

        setTimeout(() => {
          if (simulateCiFailure) {
            handleToggleCiFailure(true);
          } else {
            setStage('ci_waiting');
            addEvent('webhook', 'GitHub Actions CI runs completed successfully. All unit, lint, and contract tests passed.', {
              level: 'success',
            });
          }
          setIsSimulating(false);
        }, 3000);
      }, 2000);
    }, 1500);
  };

  const clearLogs = () => {
    setEvents([]);
  };

  // Send message in Lead Architect Chat consultation
  const sendArchitectChatMessage = async (
    userText: string,
    model: string = 'gemini-3.5-flash',
    agentRole: string = 'Lead Principal Software Architect',
    enableGrounding: boolean = true
  ) => {
    const userIntent = evaluateUserIntent(userText);
    const isFeatureRequest = userIntent === 'feature_building';
    const isInitialFeatureRequest = isFeatureRequest && (!featurePrompt || featurePrompt.trim() === '');
    const activePrompt = isFeatureRequest ? (featurePrompt || userText) : (featurePrompt || '');

    if (isInitialFeatureRequest) {
      setFeaturePrompt(userText);
      const lower = userText.toLowerCase();
      let matchedPresetId = 'auth';
      if (lower.includes('stripe') || lower.includes('billing') || lower.includes('checkout')) {
        matchedPresetId = 'stripe';
      } else if (lower.includes('rbac') || lower.includes('role') || lower.includes('permission')) {
        matchedPresetId = 'rbac';
      } else if (lower.includes('calc')) {
        matchedPresetId = 'calculator';
      }
      setSelectedPresetId(matchedPresetId);
      const matchedPreset = PRESET_FEATURES[matchedPresetId] || PRESET_FEATURES.auth;
      setContract({ ...matchedPreset.contract, frozen: false });
      setTasks(
        matchedPreset.tasks.map((t) => ({
          ...t,
          status: t.persona === 'lead' ? 'awaiting_decision' : 'blocked_contract',
          currentAction:
            t.persona === 'lead'
              ? 'Conducting requirements discovery & contract draft'
              : 'Blocked: Awaiting Gate 3 contract approval before coding',
        }))
      );
      const nextPrs: Record<string, PullRequestState> = {};
      Object.entries(matchedPreset.pullRequests).forEach(([branch, pr]) => {
        nextPrs[branch] = { ...pr, diffViewed: true };
      });
      setPullRequests(nextPrs);
      generateClarificationQuestions(userText).then((newQs) => {
        setQuestions(newQs);
      });
      setCurrentGate(1);
      setStage('requirements_approval');
    }

    const userMsg: ArchitectChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setIsSendingChatMessage(true);

    addEvent(
      'lead',
      !isFeatureRequest
        ? `Architect consultation: Answering general engineering question: "${userText.slice(0, 50)}${userText.length > 50 ? '...' : ''}"`
        : isInitialFeatureRequest
        ? `Lead Architect analyzing initial feature request: "${userText.slice(0, 60)}${userText.length > 60 ? '...' : ''}"`
        : `Architect consultation [${model}]: Planning feature "${userText.slice(0, 50)}${userText.length > 50 ? '...' : ''}"`,
      { level: 'info' }
    );

    try {
      const result = await sendLeadArchitectChatMessage(
        updatedMessages,
        activePrompt,
        requirementsBaseline,
        contract,
        tasks,
        model,
        agentRole,
        enableGrounding
      );

      const leadMsg: ArchitectChatMessage = {
        id: `msg-lead-${Date.now()}`,
        sender: 'lead',
        content: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedReplies: result.suggestedReplies,
        extractedUpdates: isFeatureRequest ? result.extractedUpdates : undefined,
        applied: isFeatureRequest && Boolean(result.extractedUpdates),
        model: result.model || model,
        groundingSources: result.groundingSources,
        agentRole,
      };

      setChatMessages((prev) => [...prev, leadMsg]);

      // Update token telemetry for consultation
      setTelemetry((prev) => {
        const pTokens = Math.max(120, userText.length * 3);
        const cTokens = Math.max(180, result.reply.length * 2);
        const added = pTokens + cTokens;
        return {
          ...prev,
          totalTokens: prev.totalTokens + added,
          promptTokens: prev.promptTokens + pTokens,
          completionTokens: prev.completionTokens + cTokens,
          estimatedCost: Number(
            (prev.estimatedCost + (pTokens * 0.1 + cTokens * 0.4) / 1000000).toFixed(4)
          ),
          breakdown: {
            ...prev.breakdown,
            lead: prev.breakdown.lead + added,
          },
        };
      });

      // If dynamic architectural updates were extracted in Feature Building Mode, apply them to baseline & contract!
      if (result.extractedUpdates && isFeatureRequest) {
        const ext = result.extractedUpdates;

        // 1. Update Requirements Baseline
        if (
          (ext.functionalRequirements && ext.functionalRequirements.length > 0) ||
          (ext.acceptanceCriteria && ext.acceptanceCriteria.length > 0) ||
          (ext.outOfScope && ext.outOfScope.length > 0)
        ) {
          setRequirementsBaseline((prev) => {
            const current = prev || {
              functionalRequirements: [],
              acceptanceCriteria: [],
              outOfScope: [],
              compiledAt: new Date().toISOString(),
              approved: false,
            };
            return {
              ...current,
              functionalRequirements: [
                ...current.functionalRequirements,
                ...(ext.functionalRequirements || []),
              ],
              acceptanceCriteria: [
                ...current.acceptanceCriteria,
                ...(ext.acceptanceCriteria || []),
              ],
              outOfScope: [
                ...current.outOfScope,
                ...(ext.outOfScope || []),
              ],
              compiledAt: new Date().toISOString(),
            };
          });
        }

        // 2. Update Contract if endpoints or types changed
        if (ext.endpointsDelta && ext.endpointsDelta.length > 0) {
          setContract((prev) => ({
            ...prev,
            apiEndpoints: [...prev.apiEndpoints, ...ext.endpointsDelta!],
          }));
        }

        // 3. Update tasks or file manifests if specified
        if (ext.taskUpdates && ext.taskUpdates.length > 0) {
          setTasks((prev) =>
            prev.map((t) => {
              if (t.persona === 'backend') {
                return {
                  ...t,
                  permittedFiles: Array.from(new Set([...t.permittedFiles, 'src/middleware/rateLimiter.ts'])),
                };
              }
              return t;
            })
          );
        }

        if (ext.contractDiffNote) {
          addEvent('lead', `[ARCHITECT] Dynamic contract revision extracted: ${ext.contractDiffNote}`, {
            level: 'success',
          });
        }
      }
    } catch (err: any) {
      addEvent('lead', `Consultation error: ${err.message || 'Failed to process architectural inquiry'}`, {
        level: 'error',
      });
    } finally {
      setIsSendingChatMessage(false);
    }
  };

  const resetSession = () => {
    setChatMessages([getWelcomeChatMessage()]);
    setFeaturePrompt('');
    setSelectedPresetId('');
    setCurrentGate(1);
    setStage('requirements_approval');
    setRequirementsBaseline(null);
    setQuestions([]);
    setSimulateCiFailure(false);
    setContract({ ...PRESET_FEATURES.auth.contract, frozen: false });
    setTasks(
      PRESET_FEATURES.auth.tasks.map((t) => ({
        ...t,
        status: t.persona === 'lead' ? 'awaiting_decision' : 'blocked_contract',
        currentAction:
          t.persona === 'lead'
            ? 'Conducting requirements discovery & contract draft'
            : 'Blocked: Awaiting Gate 3 contract approval before coding',
      }))
    );
    const initialPrs: Record<string, PullRequestState> = {};
    Object.entries(PRESET_FEATURES.auth.pullRequests).forEach(([branch, pr]) => {
      initialPrs[branch] = {
        ...pr,
        diffViewed: true,
      };
    });
    setPullRequests(initialPrs);
    addEvent('lead', 'Architectural session reset. Lead Architect waiting for feature request...', { level: 'info' });
  };

  const resetArchitectChat = resetSession;

  // Keep file selection in sync and mark diffViewed when branch changes
  useEffect(() => {
    const currentPr = pullRequests[selectedBranch];
    if (currentPr && currentPr.diffs.length > 0) {
      if (!currentPr.diffs.some((d) => d.path === selectedFilePath)) {
        setSelectedFilePath(currentPr.diffs[0].path);
      }
    }
  }, [selectedBranch, pullRequests, selectedFilePath]);

  return {
    selectedPresetId,
    selectPreset,
    featurePrompt,
    setFeaturePrompt,
    analyzePrompt,
    isGeneratingQuestions,
    simulateCiFailure,
    toggleSimulateCiFailure: handleToggleCiFailure,
    toggleScopeViolation,
    gitConfig,
    updateGitConfig,
    stage,
    setStage,
    currentGate,
    questions,
    selectQuestionOption,
    setQuestionCustomAnswer,
    requirementsBaseline,
    compileBaselineAndDecompose,
    approveAndFreezeContract,
    contract,
    tasks,
    pullRequests,
    selectedBranch,
    setSelectedBranch,
    selectedFilePath,
    setSelectedFilePath,
    activeTab,
    setActiveTab,
    diffViewMode,
    setDiffViewMode,
    events,
    filterPersona,
    setFilterPersona,
    isSimulating,
    autoScrollLogs,
    setAutoScrollLogs,
    isAgentFixing,
    confirmedDecisions,
    addEvent,
    clearLogs,
    applyAgentFix,
    applyManualOverride,
    approveAndMerge,
    rejectBranch,
    runFullSimulation,
    markDiffViewed,
    deploymentState,
    deployToProduction,
    isDeploying,
    chatMessages,
    isSendingChatMessage,
    sendArchitectChatMessage,
    resetArchitectChat,
    resetSession,
    saveCurrentProjectSnapshot,
    loadSavedProject,
    savedProjectsCount,
    telemetry,
    snapshots,
    createSnapshot,
    rollbackToSnapshot,
    handleDownloadZip,
    handlePushToGitHub,
    handleCopyContract,
    handleVisualMicroEdit,
    visualPatches,
  };
}
