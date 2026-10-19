import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AgentPersonasConfig,
  AgentModelRouteConfig,
  AgentModelConfig,
  GlobalAiProviderConfig,
  CustomAgentConfig,
  FleetState,
} from '../types/agentforge';
import {
  DEFAULT_AGENT_PERSONAS,
  DEFAULT_MODEL_ROUTES,
  DEFAULT_PRIMARY_AI_PROVIDER,
  formatGlobalModelBadge,
  formatAgentModelDisplay,
} from '../services/settingsService';

export const DEFAULT_FLEET_STATE: FleetState = {
  lead: true,
  backend: true,
  frontend: true,
  qa: true,
};

interface AgentPersonaContextType {
  personas: AgentPersonasConfig;
  primaryAiProvider: GlobalAiProviderConfig;
  fleetState: FleetState;
  customAgents: CustomAgentConfig[];
  updatePersonas: (newPersonas: Partial<AgentPersonasConfig>) => void;
  updatePrimaryAiProvider: (newConfig: Partial<GlobalAiProviderConfig>) => void;
  resetPersonas: () => void;
  toggleAgentActive: (agentId: string) => void;
  setAgentActive: (agentId: string, isActive: boolean) => void;
  isAgentActive: (agentId: string) => boolean;
  addCustomAgent: (agent: Omit<CustomAgentConfig, 'id' | 'isActive'>) => CustomAgentConfig;
  removeCustomAgent: (agentId: string) => void;
  applyCrewRecommendation: (recommendations: Record<string, boolean>) => void;
  getPersonaName: (role: 'lead' | 'backend' | 'frontend' | 'qa' | string) => string;
  getGlobalModelBadge: () => string;
  getAgentModelLabel: (role?: 'lead' | 'backend' | 'frontend' | 'qa' | string) => string;
  // Compatibility helpers
  modelRoutes: AgentModelRouteConfig;
  updateModelRoutes: (newRoutes: Partial<AgentModelRouteConfig>) => void;
  resetModelRoutes: () => void;
  getAgentModelConfig: (role?: 'lead' | 'backend' | 'frontend' | 'qa' | string) => AgentModelConfig;
}

const PERSONAS_STORAGE_KEY = 'agentforge_agent_personas';
const GLOBAL_AI_STORAGE_KEY = 'agentforge_global_ai_provider';
const FLEET_STATE_STORAGE_KEY = 'agentforge_fleet_state';
const CUSTOM_AGENTS_STORAGE_KEY = 'agentforge_custom_agents';
const ROUTES_STORAGE_KEY = 'agentforge_model_routes';

const AgentPersonaContext = createContext<AgentPersonaContextType | undefined>(undefined);

export const AgentPersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [personas, setPersonas] = useState<AgentPersonasConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_AGENT_PERSONAS;
    try {
      const saved = localStorage.getItem(PERSONAS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_AGENT_PERSONAS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load personas from localStorage:', e);
    }
    return DEFAULT_AGENT_PERSONAS;
  });

  const [primaryAiProvider, setPrimaryAiProvider] = useState<GlobalAiProviderConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_PRIMARY_AI_PROVIDER;
    try {
      const saved = localStorage.getItem(GLOBAL_AI_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PRIMARY_AI_PROVIDER, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load primary AI provider from localStorage:', e);
    }
    return DEFAULT_PRIMARY_AI_PROVIDER;
  });

  const [fleetState, setFleetState] = useState<FleetState>(() => {
    if (typeof window === 'undefined') return DEFAULT_FLEET_STATE;
    try {
      const saved = localStorage.getItem(FLEET_STATE_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_FLEET_STATE, ...JSON.parse(saved), lead: true };
      }
    } catch (e) {
      console.warn('Failed to load fleet state from localStorage:', e);
    }
    return DEFAULT_FLEET_STATE;
  });

  const [customAgents, setCustomAgents] = useState<CustomAgentConfig[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(CUSTOM_AGENTS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load custom agents from localStorage:', e);
    }
    return [];
  });

  const [modelRoutes, setModelRoutes] = useState<AgentModelRouteConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_MODEL_ROUTES;
    try {
      const saved = localStorage.getItem(ROUTES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_MODEL_ROUTES,
          ...parsed,
          lead: { ...DEFAULT_MODEL_ROUTES.lead, ...parsed.lead },
          backend: { ...DEFAULT_MODEL_ROUTES.backend, ...parsed.backend },
          frontend: { ...DEFAULT_MODEL_ROUTES.frontend, ...parsed.frontend },
          qa: { ...DEFAULT_MODEL_ROUTES.qa, ...parsed.qa },
        };
      }
    } catch (e) {
      console.warn('Failed to load model routes from localStorage:', e);
    }
    return DEFAULT_MODEL_ROUTES;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(personas));
      } catch (e) {
        console.warn('Failed to save personas to localStorage:', e);
      }
    }
  }, [personas]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(GLOBAL_AI_STORAGE_KEY, JSON.stringify(primaryAiProvider));
      } catch (e) {
        console.warn('Failed to save primary AI provider to localStorage:', e);
      }
    }
  }, [primaryAiProvider]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FLEET_STATE_STORAGE_KEY, JSON.stringify(fleetState));
      } catch (e) {
        console.warn('Failed to save fleet state to localStorage:', e);
      }
    }
  }, [fleetState]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CUSTOM_AGENTS_STORAGE_KEY, JSON.stringify(customAgents));
      } catch (e) {
        console.warn('Failed to save custom agents to localStorage:', e);
      }
    }
  }, [customAgents]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(modelRoutes));
      } catch (e) {
        console.warn('Failed to save model routes to localStorage:', e);
      }
    }
  }, [modelRoutes]);

  const updatePersonas = (newPersonas: Partial<AgentPersonasConfig>) => {
    setPersonas((prev) => ({
      ...prev,
      ...newPersonas,
    }));
  };

  const updatePrimaryAiProvider = (newConfig: Partial<GlobalAiProviderConfig>) => {
    setPrimaryAiProvider((prev) => ({
      ...prev,
      ...newConfig,
    }));
  };

  const updateModelRoutes = (newRoutes: Partial<AgentModelRouteConfig>) => {
    setModelRoutes((prev) => ({
      ...prev,
      ...newRoutes,
    }));
  };

  const resetPersonas = () => {
    setPersonas(DEFAULT_AGENT_PERSONAS);
    setFleetState(DEFAULT_FLEET_STATE);
  };

  const resetModelRoutes = () => {
    setPrimaryAiProvider(DEFAULT_PRIMARY_AI_PROVIDER);
    setModelRoutes(DEFAULT_MODEL_ROUTES);
  };

  const toggleAgentActive = (agentId: string) => {
    if (agentId === 'lead') return; // Lead Architect is always Active

    setFleetState((prev) => {
      const current = prev[agentId] !== false;
      const nextVal = !current;
      return {
        ...prev,
        [agentId]: nextVal,
      };
    });

    // Also update custom agents array if it's a custom agent
    setCustomAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const setAgentActive = (agentId: string, isActive: boolean) => {
    if (agentId === 'lead') return; // Permanent orchestrator

    setFleetState((prev) => ({
      ...prev,
      [agentId]: isActive,
    }));

    setCustomAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, isActive } : a))
    );
  };

  const isAgentActive = (agentId: string): boolean => {
    if (agentId === 'lead') return true;
    return fleetState[agentId] !== false;
  };

  const addCustomAgent = (agent: Omit<CustomAgentConfig, 'id' | 'isActive'>): CustomAgentConfig => {
    const newId = `custom-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newAgent: CustomAgentConfig = {
      ...agent,
      id: newId,
      isActive: true,
      color: agent.color || 'bg-violet-600/20 text-violet-300 border-violet-500/40',
      avatarBg: agent.avatarBg || 'bg-violet-600',
    };

    setCustomAgents((prev) => [...prev, newAgent]);
    setFleetState((prev) => ({
      ...prev,
      [newId]: true,
    }));

    return newAgent;
  };

  const removeCustomAgent = (agentId: string) => {
    setCustomAgents((prev) => prev.filter((a) => a.id !== agentId));
    setFleetState((prev) => {
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
  };

  const applyCrewRecommendation = (recommendations: Record<string, boolean>) => {
    setFleetState((prev) => ({
      ...prev,
      ...recommendations,
      lead: true, // Lead is always active
    }));
  };

  const getPersonaName = (role: 'lead' | 'backend' | 'frontend' | 'qa' | string): string => {
    const r = (role || '').toLowerCase();
    if (r === 'lead' || r.includes('lead') || r.includes('architect')) {
      return personas.lead || DEFAULT_AGENT_PERSONAS.lead;
    }
    if (r === 'backend' || r.includes('backend')) {
      return personas.backend || DEFAULT_AGENT_PERSONAS.backend;
    }
    if (r === 'frontend' || r.includes('frontend')) {
      return personas.frontend || DEFAULT_AGENT_PERSONAS.frontend;
    }
    if (r === 'qa' || r.includes('qa') || r.includes('quality')) {
      return personas.qa || DEFAULT_AGENT_PERSONAS.qa;
    }

    // Check custom agents
    const customMatch = customAgents.find((a) => a.id === role || a.title.toLowerCase() === r);
    if (customMatch) {
      return customMatch.name || customMatch.title;
    }

    return role;
  };

  const getAgentModelConfig = (_role?: 'lead' | 'backend' | 'frontend' | 'qa' | string): AgentModelConfig => {
    return {
      provider: primaryAiProvider.provider,
      model: primaryAiProvider.model,
      apiKey: primaryAiProvider.apiKey,
    };
  };

  const getGlobalModelBadge = (): string => {
    return formatGlobalModelBadge(primaryAiProvider);
  };

  const getAgentModelLabel = (_role?: 'lead' | 'backend' | 'frontend' | 'qa' | string): string => {
    return formatAgentModelDisplay({
      provider: primaryAiProvider.provider,
      model: primaryAiProvider.model,
      apiKey: primaryAiProvider.apiKey,
    });
  };

  return (
    <AgentPersonaContext.Provider
      value={{
        personas,
        primaryAiProvider,
        fleetState,
        customAgents,
        updatePersonas,
        updatePrimaryAiProvider,
        resetPersonas,
        resetModelRoutes,
        toggleAgentActive,
        setAgentActive,
        isAgentActive,
        addCustomAgent,
        removeCustomAgent,
        applyCrewRecommendation,
        getPersonaName,
        getGlobalModelBadge,
        getAgentModelLabel,
        modelRoutes,
        updateModelRoutes,
        getAgentModelConfig,
      }}
    >
      {children}
    </AgentPersonaContext.Provider>
  );
};

export const useAgentPersonas = (): AgentPersonaContextType => {
  const context = useContext(AgentPersonaContext);
  if (!context) {
    throw new Error('useAgentPersonas must be used within an AgentPersonaProvider');
  }
  return context;
};
