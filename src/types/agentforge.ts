/**
 * AgentForge Core Domain Models & Types
 */

export type PlanningStage =
  | 'discovery'
  | 'requirements_approval'
  | 'task_planning'
  | 'contract_freeze'
  | 'executing'
  | 'ci_waiting'
  | 'ci_failed'
  | 'merged';

export type DefaultAgentPersona = 'lead' | 'backend' | 'frontend' | 'qa';
export type AgentPersona = 'lead' | 'backend' | 'frontend' | 'qa' | string;

export interface CustomAgentConfig {
  id: string;
  title: string;
  name: string;
  permittedScope: string;
  systemDirective: string;
  isActive: boolean;
  color?: string;
  avatarBg?: string;
}

export type FleetState = Record<string, boolean>;

export interface CrewRecommendation {
  reason: string;
  activeWorkers: Record<string, boolean>;
}

export type WorkerTaskStatus =
  | 'idle'
  | 'blocked_contract'
  | 'drafting'
  | 'coding'
  | 'awaiting_ci'
  | 'awaiting_decision'
  | 'completed'
  | 'failed';

export type QuestionCategory = 'mandatory' | 'material' | 'low_impact';

export interface QuestionOption {
  id: string;
  label: string;
  description: string;
  isDefault?: boolean;
}

export interface PlanningQuestion {
  id: string;
  question: string;
  category: QuestionCategory;
  categoryLabel: string;
  context?: string;
  options: QuestionOption[];
  selectedOptionId: string;
  suggestedAnswer: string;
  userAnswer?: string;
  customAnswer?: string;
  isCustom?: boolean;
  status: 'pending' | 'confirmed';
}

export interface RequirementsBaseline {
  functionalRequirements: string[];
  acceptanceCriteria: string[];
  outOfScope: string[];
  compiledAt: string;
  approved: boolean;
}

export interface PlanningSession {
  id: string;
  stage: PlanningStage;
  currentGate: 1 | 2 | 3 | 'completed';
  featureTitle: string;
  userPrompt: string;
  simulateCiFailure: boolean;
  questions: PlanningQuestion[];
  requirementsBaseline?: RequirementsBaseline;
  confirmedDecisions: string[];
  contractFrozen: boolean;
}

export interface WorkerTask {
  id: string;
  title: string;
  persona: AgentPersona;
  branch: string;
  status: WorkerTaskStatus;
  permittedFiles: string[];
  contractVersion: string;
  progressPercent: number;
  currentAction?: string;
  modelConfig?: AgentModelConfig;
  isActive?: boolean;
  isCustom?: boolean;
  customDirective?: string;
}

export interface ApiEndpointSchema {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  requestType?: string;
  responseType: string;
  status: number;
}

export interface ContractSchema {
  version: string;
  checksum: string;
  frozen: boolean;
  frozenAt?: string;
  typesDefinition: string;
  componentProps?: string;
  apiEndpoints: ApiEndpointSchema[];
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agent: AgentPersona | 'system' | 'webhook';
  message: string;
  metadata?: {
    branch?: string;
    file?: string;
    step?: string;
    level?: 'info' | 'warn' | 'error' | 'success';
    durationMs?: number;
    [key: string]: unknown;
  };
}

export interface FileDiff {
  path: string;
  additions: number;
  deletions: number;
  oldContent?: string;
  newContent?: string;
  patch: string;
  isScopeViolation?: boolean;
}

export interface ScopeViolation {
  path: string;
  workerPersona: AgentPersona;
  permittedFiles: string[];
  reason: string;
}

export interface CIStepLog {
  id: string;
  name: string;
  command: 'npm run lint' | 'tsc --noEmit' | 'npm run test';
  status: 'pending' | 'running' | 'success' | 'failure';
  durationMs: number;
  logs: string[];
  errorMessage?: string;
}

export interface CIDiagnostic {
  id: string;
  failedStep: string;
  rawError: string;
  rootCause: string;
  proposedFix: {
    filePath: string;
    description: string;
    patch: string;
  };
  confidenceScore: number;
  revisionAttemptsUsed: number;
  maxRevisionAttempts: number;
  status: 'pending_review' | 'approved_and_applied' | 'rejected_manual_override';
  manualOverrideNote?: string;
}

export interface PullRequestState {
  id: string;
  title: string;
  branch: string;
  baseSha: string;
  headSha: string;
  authorPersona: AgentPersona;
  diffs: FileDiff[];
  ciStatus: 'pending' | 'success' | 'failure';
  ciLogs: CIStepLog[];
  reviewStatus: 'unreviewed' | 'approved' | 'rejected' | 'merged';
  scopeViolations?: ScopeViolation[];
  isScopeCompliant?: boolean;
  diffViewed?: boolean;
  diagnostic?: CIDiagnostic;
}

export type GitEngineMode = 'virtual' | 'live_github';

export interface GitConfig {
  mode: GitEngineMode;
  githubToken?: string;
  repoOwner?: string;
  repoName?: string;
  defaultBranch?: string;
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'ollama';

export interface AgentModelConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

export interface AgentPersonasConfig {
  lead: string;
  backend: string;
  frontend: string;
  qa: string;
}

export interface AgentModelRouteConfig {
  useMasterKey: boolean;
  masterProvider: AIProvider;
  masterApiKey: string;
  masterModel: string;
  lead: AgentModelConfig;
  backend: AgentModelConfig;
  frontend: AgentModelConfig;
  qa: AgentModelConfig;
}

export interface GlobalAiProviderConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

export interface AppSettings {
  // Tab A: API & Integrations
  githubToken: string;
  defaultRepo: string;
  geminiApiKey: string;
  openaiApiKey: string;

  // Single Global Primary AI Provider (controls all agents across pipeline)
  primaryAiProvider: GlobalAiProviderConfig;

  // Tab B: Execution Preferences
  executionMode: GitEngineMode;
  agentConcurrency: 2 | 3 | 4;

  // Tab C: Appearance & UI
  themeMode: 'system' | 'dark' | 'light';
  dashboardDensity: 'comfortable' | 'compact';

  // Tab D: Agent Personas
  agentPersonas?: AgentPersonasConfig;

  // Legacy/Backwards-compatible support if needed
  agentModelRoutes?: AgentModelRouteConfig;

  // Tab E: Secure MicroVM Sandbox Configuration
  sandboxConfig?: {
    runtime: SandboxRuntimeType;
    defaultEgressPolicy: 'DENY' | 'ALLOW';
    allowedDomains: string[];
    blockCloudMetadata: boolean;
    blockPrivateSubnets: boolean;
    secretProxyEnabled: boolean;
    memoryLimitMb: number;
    timeoutSeconds: number;
  };
}

export interface PresetFeature {
  id: string;
  name: string;
  prompt: string;
  decisions: string[];
  questions?: PlanningQuestion[];
  baseline?: RequirementsBaseline;
  contract: ContractSchema;
  tasks: WorkerTask[];
  pullRequests: Record<string, PullRequestState>;
  defaultCiFailure: boolean;
}

export type DeploymentProvider = 'vercel' | 'cloudflare';

export type DeploymentStatus =
  | 'idle'
  | 'building'
  | 'optimizing'
  | 'assigning_domain'
  | 'live'
  | 'failed';

export interface DeploymentState {
  status: DeploymentStatus;
  productionUrl: string;
  commitSha: string;
  deployedAt?: string;
  durationMs?: number;
  provider: DeploymentProvider;
  buildLogs: string[];
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  createdAt: string;
}

export interface ArchitectExtractedUpdates {
  functionalRequirements?: string[];
  acceptanceCriteria?: string[];
  outOfScope?: string[];
  contractVersion?: string;
  contractDiffNote?: string;
  typesDefinitionDelta?: string;
  endpointsDelta?: ApiEndpointSchema[];
  taskUpdates?: string[];
}

export interface ArchitectChatMessage {
  id: string;
  sender: 'user' | 'lead' | 'system';
  content: string;
  timestamp: string;
  suggestedReplies?: string[];
  extractedUpdates?: ArchitectExtractedUpdates;
  applied?: boolean;
  model?: string;
  groundingSources?: string[];
  agentRole?: string;
}

export interface TelemetryMetrics {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
  tokensSaved: number;
  breakdown: {
    lead: number;
    backend: number;
    frontend: number;
    qa: number;
    custom: number;
  };
}

export interface ProjectSnapshot {
  id: string;
  name: string;
  timestamp: string;
  description: string;
  stage: PlanningStage;
  currentGate: 1 | 2 | 3 | 'completed';
  authorPersona?: AgentPersona;
  fileCount: number;
  files: Record<string, string>;
  contract: ContractSchema;
  tasks: WorkerTask[];
}

export interface VisualEditTarget {
  id: string;
  label: string;
  componentName: string;
  currentStyle?: string;
  currentText?: string;
}

export interface VisualEditPatch {
  targetId: string;
  componentName: string;
  instruction: string;
  styleOverrides?: Record<string, string>;
  textOverride?: string;
  appliedAt: string;
}

// ===================== SECURE MICROVM SANDBOX TYPES =====================

export type SandboxRuntimeType = 'firecracker_microvm' | 'gvisor_sandbox' | 'standard_container';

export interface NetworkEgressPolicy {
  defaultPolicy: 'DENY' | 'ALLOW';
  allowedDomains: string[];
  blockCloudMetadata: boolean;
  blockPrivateSubnets: boolean;
}

export interface SecretProxyConfig {
  enabled: boolean;
  sanitizedEnvVars: string[];
  proxyEndpoint: string;
  maskedSecretsCount: number;
}

export interface ComputeQuotas {
  memoryLimitMb: number;
  cpuLimitCount: number;
  timeoutSeconds: number;
  diskLimitMb: number;
}

export interface EgressAuditLogItem {
  id: string;
  timestamp: string;
  target: string;
  port: number;
  action: 'BLOCKED' | 'ALLOWED' | 'PROXY_INJECTED';
  reason: string;
}

export interface ActiveMicroVM {
  vmId: string;
  persona: AgentPersona | string;
  kernelVersion: string;
  memoryMb: number;
  peakMemoryMb: number;
  vCpuCount: number;
  uptimeSec: number;
  status: 'running' | 'idle' | 'terminating' | 'terminated';
  networkStatus: 'isolated' | 'proxied';
}

export interface MicroVMSandboxState {
  runtime: SandboxRuntimeType;
  guestKernelVersion: string;
  isolationLevel: 'Hardware MicroVM (Dedicated Kernel)' | 'User-space Syscall Interception' | 'Shared Host Kernel (Legacy)';
  activeInstances: ActiveMicroVM[];
  networkPolicy: NetworkEgressPolicy;
  secretProxy: SecretProxyConfig;
  computeQuotas: ComputeQuotas;
  auditLogs: EgressAuditLogItem[];
  metadataProbesBlocked: number;
  egressViolationsBlocked: number;
  tokensSanitized: number;
}
