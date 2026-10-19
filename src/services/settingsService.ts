import { AppSettings, GitConfig, AgentPersonasConfig, AgentModelRouteConfig, AgentModelConfig, AIProvider, GlobalAiProviderConfig } from '../types/agentforge';
import { gitService } from './gitService';

const SETTINGS_KEY = 'agentforge_app_settings';

export const DEFAULT_AGENT_PERSONAS: AgentPersonasConfig = {
  lead: 'Alex Vance',
  backend: 'Marcus Blake',
  frontend: 'Sarah Chen',
  qa: 'Elena Rostova',
};

export const PROVIDER_DEFAULT_MODELS: Record<AIProvider, string[]> = {
  gemini: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-pro'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini'],
  anthropic: ['claude-3-7-sonnet', 'claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder'],
  ollama: ['llama3.3:70b', 'deepseek-r1:14b', 'qwen2.5-coder:32b', 'mistral:latest'],
};

export const DEFAULT_PRIMARY_AI_PROVIDER: GlobalAiProviderConfig = {
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  apiKey: '',
};

export const DEFAULT_MODEL_ROUTES: AgentModelRouteConfig = {
  useMasterKey: true,
  masterProvider: 'gemini',
  masterApiKey: '',
  masterModel: 'gemini-2.0-flash',
  lead: {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    apiKey: '',
  },
  backend: {
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: '',
  },
  frontend: {
    provider: 'anthropic',
    model: 'claude-3-7-sonnet',
    apiKey: '',
  },
  qa: {
    provider: 'deepseek',
    model: 'deepseek-reasoner',
    apiKey: '',
  },
};

export const DEFAULT_SANDBOX_CONFIG: NonNullable<AppSettings['sandboxConfig']> = {
  runtime: 'firecracker_microvm',
  defaultEgressPolicy: 'DENY',
  allowedDomains: ['registry.npmjs.org', 'github.com', 'api.github.com', 'raw.githubusercontent.com'],
  blockCloudMetadata: true,
  blockPrivateSubnets: true,
  secretProxyEnabled: true,
  memoryLimitMb: 1024,
  timeoutSeconds: 120,
};

export const DEFAULT_SETTINGS: AppSettings = {
  githubToken: '',
  defaultRepo: 'acme-corp/agentforge-app',
  geminiApiKey: '',
  openaiApiKey: '',
  primaryAiProvider: DEFAULT_PRIMARY_AI_PROVIDER,
  executionMode: 'virtual',
  agentConcurrency: 4,
  themeMode: 'dark',
  dashboardDensity: 'comfortable',
  agentPersonas: DEFAULT_AGENT_PERSONAS,
  agentModelRoutes: DEFAULT_MODEL_ROUTES,
  sandboxConfig: DEFAULT_SANDBOX_CONFIG,
};

export function loadAppSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const gitConf = gitService.getConfig();
    const themeMode = (localStorage.getItem('agentforge_theme_mode') as AppSettings['themeMode']) || 'dark';
    const density = (localStorage.getItem('agentforge_density') as AppSettings['dashboardDensity']) || 'comfortable';
    const personasRaw = localStorage.getItem('agentforge_agent_personas');
    const routesRaw = localStorage.getItem('agentforge_model_routes');

    let parsed: Partial<AppSettings> = {};
    if (raw) {
      parsed = JSON.parse(raw);
    }

    let loadedPersonas: AgentPersonasConfig = DEFAULT_AGENT_PERSONAS;
    if (parsed.agentPersonas) {
      loadedPersonas = { ...DEFAULT_AGENT_PERSONAS, ...parsed.agentPersonas };
    } else if (personasRaw) {
      try {
        loadedPersonas = { ...DEFAULT_AGENT_PERSONAS, ...JSON.parse(personasRaw) };
      } catch {
        // use default
      }
    }

    let loadedRoutes: AgentModelRouteConfig = DEFAULT_MODEL_ROUTES;
    if (parsed.agentModelRoutes) {
      loadedRoutes = {
        ...DEFAULT_MODEL_ROUTES,
        ...parsed.agentModelRoutes,
        lead: { ...DEFAULT_MODEL_ROUTES.lead, ...parsed.agentModelRoutes.lead },
        backend: { ...DEFAULT_MODEL_ROUTES.backend, ...parsed.agentModelRoutes.backend },
        frontend: { ...DEFAULT_MODEL_ROUTES.frontend, ...parsed.agentModelRoutes.frontend },
        qa: { ...DEFAULT_MODEL_ROUTES.qa, ...parsed.agentModelRoutes.qa },
      };
    } else if (routesRaw) {
      try {
        const parsedRoutes = JSON.parse(routesRaw);
        loadedRoutes = {
          ...DEFAULT_MODEL_ROUTES,
          ...parsedRoutes,
          lead: { ...DEFAULT_MODEL_ROUTES.lead, ...parsedRoutes.lead },
          backend: { ...DEFAULT_MODEL_ROUTES.backend, ...parsedRoutes.backend },
          frontend: { ...DEFAULT_MODEL_ROUTES.frontend, ...parsedRoutes.frontend },
          qa: { ...DEFAULT_MODEL_ROUTES.qa, ...parsedRoutes.qa },
        };
      } catch {
        // use default
      }
    }

    const defaultRepo =
      parsed.defaultRepo ||
      (gitConf.repoOwner && gitConf.repoName ? `${gitConf.repoOwner}/${gitConf.repoName}` : DEFAULT_SETTINGS.defaultRepo);

    const globalAiRaw = localStorage.getItem('agentforge_global_ai_provider');
    let loadedPrimaryAi: GlobalAiProviderConfig = DEFAULT_PRIMARY_AI_PROVIDER;
    if (parsed.primaryAiProvider) {
      loadedPrimaryAi = { ...DEFAULT_PRIMARY_AI_PROVIDER, ...parsed.primaryAiProvider };
    } else if (globalAiRaw) {
      try {
        loadedPrimaryAi = { ...DEFAULT_PRIMARY_AI_PROVIDER, ...JSON.parse(globalAiRaw) };
      } catch {
        // default
      }
    } else if (parsed.geminiApiKey) {
      loadedPrimaryAi = {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        apiKey: parsed.geminiApiKey,
      };
    }

    let loadedSandboxConfig = DEFAULT_SANDBOX_CONFIG;
    if (parsed.sandboxConfig) {
      loadedSandboxConfig = { ...DEFAULT_SANDBOX_CONFIG, ...parsed.sandboxConfig };
    }

    return {
      githubToken: parsed.githubToken ?? gitConf.githubToken ?? '',
      defaultRepo,
      geminiApiKey: parsed.geminiApiKey ?? '',
      openaiApiKey: parsed.openaiApiKey ?? '',
      primaryAiProvider: loadedPrimaryAi,
      executionMode: parsed.executionMode ?? gitConf.mode ?? 'virtual',
      agentConcurrency: parsed.agentConcurrency ?? 4,
      themeMode: parsed.themeMode ?? themeMode,
      dashboardDensity: parsed.dashboardDensity ?? density,
      agentPersonas: loadedPersonas,
      agentModelRoutes: loadedRoutes,
      sandboxConfig: loadedSandboxConfig,
    };
  } catch (err) {
    console.warn('Failed to parse app settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(
  settings: AppSettings,
  onGitUpdate?: (newGitConfig: Partial<GitConfig>) => void
): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem('agentforge_theme_mode', settings.themeMode);
    localStorage.setItem('agentforge_density', settings.dashboardDensity);
    if (settings.agentPersonas) {
      localStorage.setItem('agentforge_agent_personas', JSON.stringify(settings.agentPersonas));
    }
    if (settings.primaryAiProvider) {
      localStorage.setItem('agentforge_global_ai_provider', JSON.stringify(settings.primaryAiProvider));
    }
    if (settings.agentModelRoutes) {
      localStorage.setItem('agentforge_model_routes', JSON.stringify(settings.agentModelRoutes));
    }
    if (settings.sandboxConfig) {
      localStorage.setItem('agentforge_sandbox_config', JSON.stringify(settings.sandboxConfig));
    }

    // Parse repoOwner and repoName from defaultRepo (e.g., "username/repo")
    let repoOwner = 'acme-corp';
    let repoName = 'agentforge-app';
    if (settings.defaultRepo.includes('/')) {
      const parts = settings.defaultRepo.split('/');
      repoOwner = parts[0].trim();
      repoName = parts.slice(1).join('/').trim();
    } else if (settings.defaultRepo.trim()) {
      repoName = settings.defaultRepo.trim();
    }

    const gitUpdate: Partial<GitConfig> = {
      mode: settings.executionMode,
      githubToken: settings.githubToken,
      repoOwner,
      repoName,
    };

    gitService.configure(gitUpdate);
    if (onGitUpdate) {
      onGitUpdate(gitUpdate);
    }
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function getAgentEffectiveModelConfig(
  _persona?: 'lead' | 'backend' | 'frontend' | 'qa' | string,
  primaryConfig?: GlobalAiProviderConfig
): AgentModelConfig {
  const cfg = primaryConfig || loadAppSettings().primaryAiProvider || DEFAULT_PRIMARY_AI_PROVIDER;
  return {
    provider: cfg.provider,
    model: cfg.model,
    apiKey: cfg.apiKey,
  };
}

export function formatGlobalModelBadge(config?: GlobalAiProviderConfig): string {
  const cfg = config || loadAppSettings().primaryAiProvider || DEFAULT_PRIMARY_AI_PROVIDER;
  const modelName = formatAgentModelDisplay({ provider: cfg.provider, model: cfg.model, apiKey: '' });
  return `Powered by ${modelName}`;
}

export function formatAgentModelDisplay(config: { provider?: string; model: string; apiKey?: string }): string {
  let m = config.model;
  if (m === 'gemini-2.0-flash') m = 'Gemini 2.0 Flash';
  else if (m === 'gemini-1.5-flash') m = 'Gemini 1.5 Flash';
  else if (m === 'gemini-1.5-pro') m = 'Gemini 1.5 Pro';
  else if (m === 'gemini-2.5-pro') m = 'Gemini 2.5 Pro';
  else if (m === 'gpt-4o') m = 'GPT-4o';
  else if (m === 'gpt-4o-mini') m = 'GPT-4o mini';
  else if (m === 'o1') m = 'o1';
  else if (m === 'o3-mini') m = 'o3-mini';
  else if (m === 'claude-3-7-sonnet') m = 'Claude 3.7 Sonnet';
  else if (m === 'claude-3-5-sonnet') m = 'Claude 3.5 Sonnet';
  else if (m === 'claude-3-5-haiku') m = 'Claude 3.5 Haiku';
  else if (m === 'claude-3-opus') m = 'Claude 3 Opus';
  else if (m === 'deepseek-reasoner') m = 'DeepSeek R1';
  else if (m === 'deepseek-chat') m = 'DeepSeek V3';
  else if (m === 'deepseek-coder') m = 'DeepSeek Coder';
  else if (m.startsWith('llama3.3')) m = 'Llama 3.3 (70B)';
  else if (m.includes('deepseek-r1')) m = 'DeepSeek R1 (14B)';
  else if (m.includes('qwen')) m = 'Qwen 2.5 Coder';
  else if (m.includes('mistral')) m = 'Mistral Latest';

  return m;
}
