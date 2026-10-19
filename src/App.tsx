/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  GitPullRequest,
  ShieldCheck,
  CheckCircle2,
  Monitor,
  Loader2,
  Sparkles,
  Bot,
  Layers,
  Folder,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { MicroVMSandboxViewer } from './components/MicroVMSandboxViewer';
import { useAgentForgeSimulation } from './hooks/useAgentForgeSimulation';
import { useAuth } from './context/AuthContext';
import { AuthGateway } from './components/AuthGateway';
import { Header } from './components/Header';
import { PipelineStepper } from './components/PipelineStepper';
import { PresetsBar } from './components/PresetsBar';
import { LeadArchitectChat } from './components/LeadArchitectChat';
import { TeamRosterCard } from './components/TeamRosterCard';
import { ConversationalHero } from './components/ConversationalHero';
import { FeatureInputBox } from './components/FeatureInputBox';
import { AgentKanban } from './components/AgentKanban';
import { ActivityLogTerminal } from './components/ActivityLogTerminal';
import { PullRequestDiffViewer } from './components/PullRequestDiffViewer';
import { ContractSchemaViewer } from './components/ContractSchemaViewer';
import { CIPipelineChecks } from './components/CIPipelineChecks';
import { ReviewActionDrawer } from './components/ReviewActionDrawer';
import { GitConfigModal } from './components/GitConfigModal';
import { LiveAppPreview } from './components/LiveAppPreview';
import { LiveAgentWorkspace } from './components/LiveAgentWorkspace';
import { AgentCodeDrawer } from './components/AgentCodeDrawer';
import { MyProjectsModal } from './components/MyProjectsModal';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { TermsPrivacyModal } from './components/TermsPrivacyModal';
import { ChatHistoryModal } from './components/ChatHistoryModal';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { density } = useTheme();
  const isCompact = density === 'compact';

  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isMyProjectsOpen, setIsMyProjectsOpen] = useState(false);
  const [inspectingWorkerPersona, setInspectingWorkerPersona] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'executive' | 'developer'>('executive');
  const [viewOverride, setViewOverride] = useState<'planning' | 'execution' | null>(null);

  const {
    selectedPresetId,
    selectPreset,
    featurePrompt,
    setFeaturePrompt,
    analyzePrompt,
    isGeneratingQuestions,
    simulateCiFailure,
    toggleSimulateCiFailure,
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
  } = useAgentForgeSimulation();

  const { isLoading, isAuthenticated } = useAuth();

  const currentPr = pullRequests[selectedBranch] || Object.values(pullRequests)[0];

  // Stage-Gated Lifecycle:
  // Phase 0 (Empty/New State): Centered Minimalist Conversational Hero
  // Phase 1 (Orchestration Discovery): Lead Architect Alex Gate 1 Dialogue
  // Phase 2 (Gate 2 Roster Reveal): Team Roster & Task Assignment slides in below chat
  // Phase 3 (Execution Phase): Multi-Agent Workspace (Kanban, PR Diffs, CI, Logs)
  const hasStartedSession =
    chatMessages.some((m) => m.sender === 'user') ||
    Boolean(featurePrompt && featurePrompt.trim().length > 0) ||
    Boolean(selectedPresetId && selectedPresetId.length > 0) ||
    Boolean(requirementsBaseline) ||
    contract.frozen ||
    ['executing', 'ci_waiting', 'ci_failed', 'merged'].includes(stage);

  const isExecutionPhase =
    viewOverride === 'execution' ||
    (viewOverride !== 'planning' &&
      (contract.frozen ||
        ['executing', 'ci_waiting', 'ci_failed', 'merged'].includes(stage)));

  const isHeroState =
    !hasStartedSession && viewOverride !== 'execution' && viewOverride !== 'planning';

  const isPlanReviewPhase = !isExecutionPhase && !isHeroState && Boolean(requirementsBaseline);

  const handleStartSession = (prompt: string, presetId?: string) => {
    if (presetId) {
      selectPreset(presetId);
    } else {
      setFeaturePrompt(prompt);
      sendArchitectChatMessage(prompt);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-xs font-mono">Verifying AgentForge session token...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthGateway />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Global Side Navigation Bar (Left Sidebar) */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNewProject={() => {
          setViewOverride(null);
          if (stage === 'executing' || stage === 'ci_waiting') {
            if (window.confirm('Reset the workspace and start a fresh project? Current task progress will be cleared.')) {
              resetSession();
              setActiveTab('contract');
            }
          } else {
            resetSession();
            setActiveTab('contract');
          }
        }}
        onSelectDashboard={() => {
          setActiveTab('preview');
        }}
        onOpenMyProjects={() => setIsMyProjectsOpen(true)}
        savedProjectsCount={savedProjectsCount}
        onOpenChatHistory={() => setIsChatHistoryOpen(true)}
        chatMessagesCount={chatMessages.length}
        activeFeatureName={featurePrompt ? featurePrompt.slice(0, 35) : undefined}
        stage={stage}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        activeNav={isMyProjectsOpen ? 'projects' : isChatHistoryOpen ? 'chat' : 'dashboard'}
        snapshots={snapshots}
        onRollbackSnapshot={rollbackToSnapshot}
        onCreateSnapshot={createSnapshot}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Universal Top Navigation Bar with Dual-Mode Git status & Stage 5 Deploy Action */}
        <Header
          onRunSimulation={runFullSimulation}
          isSimulating={isSimulating}
          onReset={() => {
            resetSession();
            setViewOverride(null);
          }}
          gitMode={gitConfig.mode}
          onOpenGitConfig={() => setIsSettingsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMyProjects={() => setIsMyProjectsOpen(true)}
          savedProjectsCount={savedProjectsCount}
          stage={stage}
          deploymentState={deploymentState}
          onDeployToProduction={deployToProduction}
          isDeploying={isDeploying}
          onViewPreviewTab={() => setActiveTab('preview')}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
          telemetry={telemetry}
          onDownloadZip={handleDownloadZip}
          onPushToGitHub={handlePushToGitHub}
          onCopyContract={handleCopyContract}
        />

        {/* Top 5-Stage Pipeline Stepper (Hidden in Conversational Hero State) */}
        {!isHeroState && (
          <PipelineStepper
            currentStage={stage}
            simulateCiFailure={simulateCiFailure}
            onSelectStage={(s) => {
              setStage(s);
              if (s === 'discovery' || s === 'requirements_approval' || s === 'task_planning') {
                setViewOverride('planning');
              } else {
                setViewOverride('execution');
              }
            }}
          />
        )}

        {/* Stage-Gated Workspace Routing:
            1. isHeroState: Centered Minimalist Conversational Hero
            2. !isExecutionPhase: Orchestration Discovery (Gate 1 Dialogue & Gate 2 Team Roster Reveal)
            3. isExecutionPhase: Multi-Agent Execution Workspace */}
        {isHeroState ? (
          <ConversationalHero
            onStartSession={handleStartSession}
            isSending={isSendingChatMessage}
          />
        ) : !isExecutionPhase ? (
          /* ================= ORCHESTRATION DISCOVERY & STAGE-GATED REVEAL VIEW ================= */
          <div className="flex-1 flex flex-col items-center overflow-y-auto px-4 py-5 sm:py-7 bg-slate-50 dark:bg-slate-950/70 transition-colors">
            <div className="w-full max-w-5xl flex flex-col gap-4 sm:gap-6">
              {/* Return to Live Execution Workspace shortcut when consultation was requested */}
              {contract.frozen && (
                <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-indigo-950/50 border border-indigo-800/50 text-xs shadow-xs animate-fade-in">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Contract {contract.version} is frozen. Multi-Agent execution is in progress.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewOverride('execution')}
                    className="flex items-center gap-1.5 px-3 py-1 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Back to Live Workspace</span>
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              )}

              {/* 1. Top: Collapsible "Architectural Suggestions" carousel */}
              <PresetsBar
                selectedPresetId={selectedPresetId}
                onSelectPreset={(id) => {
                  selectPreset(id);
                  setViewOverride(null);
                }}
              />

              {/* 2. Center/Primary: Expanded, prominent "Lead Architect Chat" (Alex Vance) */}
              <LeadArchitectChat
                messages={chatMessages}
                onSendMessage={sendArchitectChatMessage}
                isSending={isSendingChatMessage}
                onResetChat={resetArchitectChat}
                requirementsBaseline={requirementsBaseline}
                contract={contract}
                onApproveAndFreezeContract={() => {
                  approveAndFreezeContract();
                  setViewOverride(null);
                }}
                onCompileBaseline={compileBaselineAndDecompose}
                isExpanded={true}
              />

              {/* 3. Stage-Gated Agent Fleet Reveal:
                     Only reveal worker agents (Backend, Frontend, QA, or Custom Agents)
                     AFTER the Lead Architect finishes requirements discovery (Gate 1)
                     and presents Task Decomposition / Crew Assignment (Gate 2). */}
              {isPlanReviewPhase && (
                <TeamRosterCard
                  tasks={tasks}
                  requirementsBaseline={requirementsBaseline}
                  contractVersion={contract.version}
                  onApproveAndDispatch={() => {
                    approveAndFreezeContract();
                    setViewOverride(null);
                  }}
                  isSimulating={isSimulating}
                  featurePrompt={featurePrompt}
                  chatMessages={chatMessages}
                  simulateCiFailure={simulateCiFailure}
                  onToggleCiFailure={toggleSimulateCiFailure}
                  contract={contract}
                  onInspectWorker={(persona) => setInspectingWorkerPersona(persona)}
                />
              )}
            </div>
          </div>
        ) : (
          /* ================= EXECUTION PHASE VIEW (STAGE 3+ MULTI-AGENT WORKSPACE) ================= */
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full overflow-hidden">
            {/* LEFT PANEL: Multi-Agent Kanban & Streaming Terminal Activity */}
            <div
              className={`w-full lg:w-[48%] xl:w-[46%] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto ${
                isCompact ? 'p-3 gap-3.5' : 'p-4 sm:p-5 gap-5'
              } bg-white dark:bg-slate-950/60`}
            >
              {/* Execution Status Header with Quick Consultation Button */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Multi-Agent Fleet Active
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                    {stage}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewOverride('planning')}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Consult Architect Alex</span>
                </button>
              </div>

              {/* Agent Kanban Cards */}
              <AgentKanban
                tasks={tasks}
                selectedBranch={selectedBranch}
                onSelectTaskBranch={(branch) => {
                  if (pullRequests[branch]) {
                    setSelectedBranch(branch);
                    markDiffViewed(branch);
                    setActiveTab('diffs');
                  }
                }}
                onInspectWorker={(persona) => setInspectingWorkerPersona(persona)}
              />

              {/* Streaming Terminal Activity Log */}
              <ActivityLogTerminal
                events={events}
                filterPersona={filterPersona}
                onFilterChange={setFilterPersona}
                autoScroll={autoScrollLogs}
                onToggleAutoScroll={setAutoScrollLogs}
                onClearLogs={clearLogs}
              />
            </div>

        {/* ================= RIGHT PANEL: Inspection & Review Drawer ================= */}
        <div className="w-full lg:w-[52%] xl:w-[54%] flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          {/* Right Panel Tabs Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {viewMode === 'executive' ? (
                /* ================= EXECUTIVE VIEW TABS ================= */
                <>
                  {/* Tab 1: Live App Preview (Priority Default in Executive View) */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'preview'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-slate-800/40 font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                    <span>Visual App Preview</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{deploymentState.status === 'live' ? 'Live' : 'Active'}</span>
                    </span>
                  </button>

                  {/* Tab 2: Live Agent Workspace */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('contract')}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'contract'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-slate-800/40 font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span>Live Agent Workspace</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800/40">
                      4 Agents
                    </span>
                  </button>

                  {/* Tab 3: Automated Quality & Security Checks */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('ci')}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'ci'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-slate-800/40 font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        stage === 'ci_failed' || currentPr?.ciStatus === 'failure'
                          ? 'text-rose-500 dark:text-rose-400'
                          : 'text-emerald-500 dark:text-emerald-400'
                      }`}
                    />
                    <span>Automated Tests</span>
                    {stage === 'ci_failed' || currentPr?.ciStatus === 'failure' ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50">
                        Needs Fix
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50">
                        3/3 Passed
                      </span>
                    )}
                  </button>

                  {/* Tab 3: 📁 Code & Files */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('diffs');
                      markDiffViewed();
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'diffs'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-slate-800/40 font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span>📁 Code & Files</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                      Explorer
                    </span>
                  </button>

                  {/* Tab 4: 🔒 MicroVM Sandbox */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('sandbox')}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'sandbox'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-slate-800/40 font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span>🔒 MicroVM Sandbox</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                      Firecracker
                    </span>
                  </button>
                </>
              ) : (
                /* ================= DEVELOPER VIEW TABS ================= */
                <>
                  {/* Tab 1: 📁 Code & Files */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('diffs');
                      markDiffViewed();
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'diffs'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-slate-800/40 font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span>📁 Code & Files</span>
                    {currentPr && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                        {currentPr.diffs.length} PR diffs
                      </span>
                    )}
                  </button>

                  {/* Tab 2: Frozen Contract Schema */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('contract')}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'contract'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-slate-800/40 font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span>Frozen Contract Schema</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        contract.frozen
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40'
                      }`}
                    >
                      {contract.frozen ? `${contract.version} (Frozen)` : `${contract.version} (Draft)`}
                    </span>
                  </button>

                  {/* Tab 3: CI Pipeline Checks */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('ci')}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'ci'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-slate-800/40 font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        stage === 'ci_failed' || currentPr?.ciStatus === 'failure'
                          ? 'text-rose-500 dark:text-rose-400'
                          : 'text-emerald-500 dark:text-emerald-400'
                      }`}
                    />
                    <span>CI Pipeline Checks</span>
                    {stage === 'ci_failed' || currentPr?.ciStatus === 'failure' ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50">
                        Failed
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50">
                        Passed
                      </span>
                    )}
                  </button>

                  {/* Tab 4: Live App Preview */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'preview'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-slate-800/40 font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                    <span>Live App Preview</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{deploymentState.status === 'live' ? 'Production: Live' : 'Runtime: Active'}</span>
                    </span>
                  </button>

                  {/* Tab 5: 🔒 MicroVM Sandbox */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('sandbox')}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'sandbox'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-slate-800/40 font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span>MicroVM Sandbox</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                      Hardware Isolated
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Active Tab Viewport Area */}
          <div className="flex-1 min-h-[460px] lg:min-h-0 overflow-hidden flex flex-col">
            {activeTab === 'diffs' && (
              <PullRequestDiffViewer
                pullRequests={pullRequests}
                selectedBranch={selectedBranch}
                onSelectBranch={(branch) => {
                  setSelectedBranch(branch);
                  markDiffViewed(branch);
                }}
                selectedFilePath={selectedFilePath}
                onSelectFilePath={(path) => {
                  setSelectedFilePath(path);
                  markDiffViewed();
                }}
                diffViewMode={diffViewMode}
                onChangeDiffViewMode={setDiffViewMode}
                onToggleScopeViolation={toggleScopeViolation}
                onApplyFix={applyAgentFix}
                isAgentFixing={isAgentFixing}
                contract={contract}
                onInspectWorker={(persona) => setInspectingWorkerPersona(persona)}
              />
            )}

            {activeTab === 'contract' && (
              viewMode === 'executive' ? (
                <LiveAgentWorkspace
                  tasks={tasks}
                  stage={stage}
                  contract={contract}
                  featurePrompt={featurePrompt}
                  selectedPresetId={selectedPresetId}
                  isSimulating={isSimulating}
                  onRunSimulation={runFullSimulation}
                  onApproveAndFreeze={approveAndFreezeContract}
                  onViewLivePreview={() => setActiveTab('preview')}
                  onSwitchToCodeView={() => setViewMode('developer')}
                  deploymentState={deploymentState}
                  onInspectWorker={(persona) => setInspectingWorkerPersona(persona)}
                />
              ) : (
                <ContractSchemaViewer
                  contract={contract}
                  onApproveAndFreeze={approveAndFreezeContract}
                />
              )
            )}

            {activeTab === 'ci' && (
              <CIPipelineChecks
                currentPr={currentPr}
                onApplyFix={applyAgentFix}
                onManualOverride={applyManualOverride}
                isAgentFixing={isAgentFixing}
              />
            )}

            {activeTab === 'preview' && (
              <LiveAppPreview
                selectedPresetId={selectedPresetId}
                gitMode={gitConfig.mode}
                productionUrl={deploymentState.productionUrl}
                onDeployToProduction={deployToProduction}
                isDeployed={deploymentState.status === 'live'}
                requirementsBaseline={requirementsBaseline}
                featurePrompt={featurePrompt}
                tasks={tasks}
                stage={stage}
                contract={contract}
                onRunSimulation={runFullSimulation}
                isSimulating={isSimulating}
                onVisualMicroEdit={handleVisualMicroEdit}
              />
            )}

            {activeTab === 'sandbox' && (
              <MicroVMSandboxViewer onOpenSettings={() => setIsSettingsOpen(true)} />
            )}
          </div>

          {/* Bottom Review Action Drawer (Sticky footer of Right Panel) */}
          <ReviewActionDrawer
            currentPr={currentPr}
            stage={stage}
            contractVersion={contract.version}
            onApproveAndMerge={approveAndMerge}
            onApplyAgentFix={applyAgentFix}
            onRejectBranch={() => rejectBranch()}
            onViewDiffTab={() => {
              setActiveTab('diffs');
              markDiffViewed();
            }}
            isAgentFixing={isAgentFixing}
            deploymentState={deploymentState}
            onDeployToProduction={deployToProduction}
            isDeploying={isDeploying}
            onViewPreviewTab={() => setActiveTab('preview')}
            viewMode={viewMode}
            onDownloadZip={handleDownloadZip}
            onPushToGitHub={handlePushToGitHub}
            onCopyContract={handleCopyContract}
          />
        </div>
      </div>
    )}

      {/* Subtle Legal & Safety Guardrails Footer */}
      <footer className="text-center py-2.5 px-4 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 transition-colors duration-200">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-center sm:text-left">
          AgentForge uses AI to generate code. Output is provided as-is without warranty. Do not input sensitive credentials or proprietary data.
        </p>
        <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
          <span>Enterprise Multi-Agent Sandbox</span>
          <span>•</span>
          <span>v1.4.0</span>
        </div>
      </footer>
    </div>

      {/* Comprehensive SaaS Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onGitConfigSaved={updateGitConfig}
        chatMessages={chatMessages}
        currentContract={contract}
      />

      {/* Legal & Safety Terms Modal */}
      <TermsPrivacyModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      {/* Chat History & Transcript Drawer/Modal */}
      <ChatHistoryModal
        isOpen={isChatHistoryOpen}
        onClose={() => setIsChatHistoryOpen(false)}
        messages={chatMessages}
        onFocusArchitectChat={() => {
          setActiveTab('contract');
        }}
      />

      {/* Dual-Mode Git Configuration Modal (Legacy direct trigger) */}
      <GitConfigModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
        config={gitConfig}
        onSaveConfig={updateGitConfig}
      />

      {/* My Projects Saved Snapshots Modal */}
      <MyProjectsModal
        isOpen={isMyProjectsOpen}
        onClose={() => setIsMyProjectsOpen(false)}
        onSelectProject={(project) => {
          loadSavedProject(project);
          setIsMyProjectsOpen(false);
        }}
        onSaveCurrentState={saveCurrentProjectSnapshot}
      />

      {/* Direct Agent Source Code Inspection Slide-Over Drawer */}
      <AgentCodeDrawer
        persona={inspectingWorkerPersona}
        isOpen={Boolean(inspectingWorkerPersona)}
        onClose={() => setInspectingWorkerPersona(null)}
        contract={contract}
        tasks={tasks}
        featureDomain={selectedPresetId || 'auth'}
        onOpenInFullViewer={(path, branch) => {
          setSelectedFilePath(path);
          if (branch && pullRequests[branch]) {
            setSelectedBranch(branch);
          }
          setActiveTab('diffs');
          setInspectingWorkerPersona(null);
        }}
      />
    </div>
  );
}
