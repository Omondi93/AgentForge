import React, { useState, useMemo } from 'react';
import {
  Layers,
  Globe,
  Code2,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Search,
  Copy,
  Check,
  Download,
  Share2,
  Eye,
  Server,
  Monitor,
  CheckCheck,
  Filter,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ContractSchema, WorkerTask, AgentPersona } from '../types/agentforge';

export interface ArchitectureVisualizerProps {
  contract: ContractSchema;
  tasks?: WorkerTask[];
  onClose?: () => void;
  isInline?: boolean;
}

export type ArchitectureLayer = 'all' | 'api' | 'dto' | 'ui' | 'qa';

interface ArchNode {
  id: string;
  name: string;
  layer: 'client' | 'api' | 'dto' | 'ui' | 'qa';
  layerLabel: string;
  worker: AgentPersona | 'system';
  workerLabel: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path?: string;
  signature?: string;
  description: string;
  dependencies: string[]; // target node IDs
  status: 'frozen' | 'active' | 'verified';
}

export const ArchitectureVisualizer: React.FC<ArchitectureVisualizerProps> = ({
  contract,
  tasks = [],
  onClose,
  isInline = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<ArchitectureLayer>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedMermaid, setCopiedMermaid] = useState(false);
  const [showMermaidModal, setShowMermaidModal] = useState(false);

  // Construct dynamic architectural nodes from frozen contract and tasks
  const nodes = useMemo<ArchNode[]>(() => {
    const list: ArchNode[] = [];

    // 1. API Endpoints from contract (Backend Worker)
    contract.apiEndpoints.forEach((ep, idx) => {
      const epId = `api-${idx}-${ep.method}-${ep.path.replace(/\//g, '-')}`;
      list.push({
        id: epId,
        name: `${ep.method} ${ep.path}`,
        layer: 'api',
        layerLabel: 'API Endpoint',
        worker: 'backend',
        workerLabel: 'Backend Worker',
        method: ep.method,
        path: ep.path,
        signature: `status: ${ep.status} | response: ${ep.responseType}${
          ep.requestType ? ` | request: ${ep.requestType}` : ''
        }`,
        description: ep.description || `Next.js App Router route handler for ${ep.path}`,
        dependencies: ep.responseType ? [`dto-${ep.responseType}`] : [],
        status: contract.frozen ? 'frozen' : 'active',
      });
    });

    // 2. DTO Models parsed or derived from typesDefinition
    const typeRegex = /(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_]+)/g;
    const foundTypes: string[] = [];
    let match;
    while ((match = typeRegex.exec(contract.typesDefinition)) !== null) {
      if (match[1] && !foundTypes.includes(match[1])) {
        foundTypes.push(match[1]);
      }
    }

    if (foundTypes.length === 0) {
      foundTypes.push('ContractPayload', 'ApiResponse', 'AuthSessionDTO');
    }

    foundTypes.forEach((typeName) => {
      list.push({
        id: `dto-${typeName}`,
        name: typeName,
        layer: 'dto',
        layerLabel: 'Contract DTO Model',
        worker: 'lead',
        workerLabel: 'Lead Architect',
        signature: `interface ${typeName} { ... }`,
        description: `Frozen schema definition enforcing structural type safety across workers.`,
        dependencies: [],
        status: 'frozen',
      });
    });

    // 3. React UI Components (Frontend Worker)
    const frontendTask = tasks.find((t) => t.persona === 'frontend');
    const compNames = ['LoginForm', 'SessionBadge', 'FeatureDashboard'];
    compNames.forEach((compName, idx) => {
      const compId = `ui-${compName.toLowerCase()}`;
      list.push({
        id: compId,
        name: `<${compName} />`,
        layer: 'ui',
        layerLabel: 'React Component',
        worker: 'frontend',
        workerLabel: 'Frontend Worker',
        signature: `export function ${compName}(props: ${compName}Props): JSX.Element`,
        description: `Client component strictly rendering frozen contract data without direct DB mutations.`,
        dependencies: list.filter((n) => n.layer === 'api').map((n) => n.id).slice(0, 2),
        status: frontendTask?.status === 'completed' ? 'verified' : 'active',
      });
    });

    // 4. QA Conformance Tests (QA Worker)
    const qaTask = tasks.find((t) => t.persona === 'qa');
    list.push({
      id: 'qa-schema-suite',
      name: 'Contract Conformance Suite',
      layer: 'qa',
      layerLabel: 'Vitest Automated Suite',
      worker: 'qa',
      workerLabel: 'QA Worker',
      signature: 'vitest run tests/contracts/*.test.ts',
      description: `Automated test verifying strict adherence to schema checksum ${contract.checksum.slice(
        0,
        12
      )}...`,
      dependencies: list.map((n) => n.id).slice(0, 3),
      status: qaTask?.status === 'completed' ? 'verified' : 'active',
    });

    return list;
  }, [contract, tasks]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'api' && node.layer === 'api') ||
        (activeFilter === 'dto' && node.layer === 'dto') ||
        (activeFilter === 'ui' && node.layer === 'ui') ||
        (activeFilter === 'qa' && node.layer === 'qa');

      const matchesSearch =
        !searchQuery.trim() ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.workerLabel.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [nodes, activeFilter, searchQuery]);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0] || null;
  }, [nodes, selectedNodeId]);

  // Generate Mermaid diagram definition
  const mermaidGraph = useMemo(() => {
    let code = `graph TD\n  %% AgentForge Contract Architecture v${contract.version}\n`;
    code += `  subgraph Frontend["Frontend Layer (React)"]\n`;
    nodes
      .filter((n) => n.layer === 'ui')
      .forEach((n) => {
        code += `    ${n.id.replace(/-/g, '_')}["${n.name}"]\n`;
      });
    code += `  end\n\n`;

    code += `  subgraph Backend["Backend Layer (Next.js API Routes)"]\n`;
    nodes
      .filter((n) => n.layer === 'api')
      .forEach((n) => {
        code += `    ${n.id.replace(/-/g, '_')}["${n.name}"]\n`;
      });
    code += `  end\n\n`;

    code += `  subgraph DTOs["Frozen Contract Invariant (DTOs)"]\n`;
    nodes
      .filter((n) => n.layer === 'dto')
      .forEach((n) => {
        code += `    ${n.id.replace(/-/g, '_')}["${n.name}"]\n`;
      });
    code += `  end\n\n`;

    code += `  subgraph QA["QA Verification Suite"]\n`;
    nodes
      .filter((n) => n.layer === 'qa')
      .forEach((n) => {
        code += `    ${n.id.replace(/-/g, '_')}["${n.name}"]\n`;
      });
    code += `  end\n\n`;

    // Connect UI to API
    nodes
      .filter((n) => n.layer === 'ui')
      .forEach((uiNode) => {
        const api = nodes.find((n) => n.layer === 'api');
        if (api) {
          code += `  ${uiNode.id.replace(/-/g, '_')} -->|Fetch DTO| ${api.id.replace(/-/g, '_')}\n`;
        }
      });

    // Connect API to DTO
    nodes
      .filter((n) => n.layer === 'api')
      .forEach((apiNode) => {
        const dto = nodes.find((n) => n.layer === 'dto');
        if (dto) {
          code += `  ${apiNode.id.replace(/-/g, '_')} -.->|Implements| ${dto.id.replace(/-/g, '_')}\n`;
        }
      });

    // Connect QA to API & UI
    const qa = nodes.find((n) => n.layer === 'qa');
    if (qa) {
      code += `  ${qa.id.replace(/-/g, '_')} ==>|Asserts Conformance| Backend\n`;
    }

    return code;
  }, [nodes, contract]);

  const handleCopyContractJson = () => {
    navigator.clipboard.writeText(JSON.stringify(contract, null, 2));
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(mermaidGraph);
    setCopiedMermaid(true);
    setTimeout(() => setCopiedMermaid(false), 2000);
  };

  const getLayerColor = (layer: string) => {
    switch (layer) {
      case 'api':
        return 'text-sky-400 bg-sky-950/60 border-sky-800/60';
      case 'dto':
        return 'text-purple-400 bg-purple-950/60 border-purple-800/60';
      case 'ui':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      case 'qa':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      default:
        return 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60';
    }
  };

  const getWorkerBadge = (worker: string) => {
    switch (worker) {
      case 'backend':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'frontend':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'qa':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'lead':
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className={`flex flex-col ${isInline ? 'h-full' : 'h-[640px]'} bg-slate-950 text-slate-100 select-text rounded-xl overflow-hidden border border-slate-800 shadow-xl`}>
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">
                Architecture Dependency Graph
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Contract {contract.version}</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Multi-worker dependency flow & frozen DTO data pipelines
            </span>
          </div>
        </div>

        {/* Action Buttons: Copy JSON & Export Mermaid */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyContractJson}
            title="Copy Contract JSON"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            {copiedContract ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copiedContract ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMermaidModal(true)}
            title="View & copy Mermaid.js syntax"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 transition-colors cursor-pointer"
          >
            <Share2 className="w-3 h-3 text-indigo-400" />
            <span>Mermaid Graph</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 shrink-0 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            All Nodes ({nodes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('api')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === 'api'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>API Routes ({nodes.filter((n) => n.layer === 'api').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('dto')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === 'dto'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>Contract DTOs ({nodes.filter((n) => n.layer === 'dto').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ui')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === 'ui'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            <Monitor className="w-3 h-3" />
            <span>UI Components ({nodes.filter((n) => n.layer === 'ui').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('qa')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === 'qa'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            <CheckCheck className="w-3 h-3" />
            <span>QA Tests ({nodes.filter((n) => n.layer === 'qa').length})</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[180px] max-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes or models..."
            className="w-full pl-8 pr-2.5 py-1 text-[11px] rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Graph & Inspector Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Interactive Visual Graph Canvas (col-span-8) */}
        <div className="lg:col-span-8 p-4 overflow-y-auto bg-slate-950/90 relative flex flex-col gap-6">
          {/* Layer Pipeline Flow Header */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-2 py-1 bg-slate-900/60 rounded border border-slate-800/60">
            <span className="flex items-center gap-1 text-emerald-400">
              <Monitor className="w-3 h-3" /> Frontend UI
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="flex items-center gap-1 text-sky-400">
              <Globe className="w-3 h-3" /> App Router Routes
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="flex items-center gap-1 text-purple-400">
              <Code2 className="w-3 h-3" /> Frozen DTO Invariant
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="flex items-center gap-1 text-amber-400">
              <CheckCheck className="w-3 h-3" /> Vitest QA Suite
            </span>
          </div>

          {/* Flow Grid by Layers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${getLayerColor(
                        node.layer
                      )}`}
                    >
                      {node.layerLabel}
                    </span>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getWorkerBadge(
                        node.worker
                      )}`}
                    >
                      {node.workerLabel}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-1.5">
                    {node.method && (
                      <span className="text-[10px] font-black font-mono text-sky-400 bg-sky-950 px-1.5 py-0.2 rounded border border-sky-800/80">
                        {node.method}
                      </span>
                    )}
                    <span className="text-xs font-bold text-white font-mono group-hover:text-indigo-300 transition-colors truncate">
                      {node.name}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                    {node.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/70">
                    <span className="truncate max-w-[180px]">{node.signature}</span>
                    <span className="text-emerald-400 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Conforms</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredNodes.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">No architectural nodes match the current filter or search.</p>
            </div>
          )}
        </div>

        {/* Selected Node Inspector Drawer (col-span-4) */}
        <div className="lg:col-span-4 p-4 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col gap-4 overflow-y-auto">
          {selectedNode ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${getLayerColor(
                      selectedNode.layer
                    )}`}
                  >
                    {selectedNode.layerLabel}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Contract Invariant</span>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white font-mono">{selectedNode.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedNode.description}</p>
              </div>

              {/* Owner Worker Badge */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Responsible Autonomous Agent
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    {selectedNode.workerLabel}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Scope Guard: Verified
                  </span>
                </div>
              </div>

              {/* Technical Signature */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Type / Method Signature
                </span>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 break-all leading-relaxed">
                  {selectedNode.signature}
                </div>
              </div>

              {/* Associated Contract Excerpt */}
              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Contract Schema Excerpt
                </span>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[160px] whitespace-pre-wrap">
                  {selectedNode.layer === 'api'
                    ? JSON.stringify(
                        contract.apiEndpoints.find((ep) => ep.path === selectedNode.path) ||
                          contract.apiEndpoints[0],
                        null,
                        2
                      )
                    : selectedNode.layer === 'dto'
                    ? contract.typesDefinition.slice(0, 320) + '\n// ... strictly frozen'
                    : contract.componentProps || '// Component interface bound to DTO props'}
                </pre>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 text-center py-12">
              Select any node in the graph to inspect properties.
            </div>
          )}
        </div>
      </div>

      {/* Mermaid.js Code Modal */}
      {showMermaidModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Mermaid.js Architecture Definition</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMermaidModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Copy this Mermaid markup directly into GitHub READMEs, documentation, or Notion to
              render the live dependency graph.
            </p>

            <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[280px]">
              {mermaidGraph}
            </pre>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCopyMermaid}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                {copiedMermaid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMermaid ? 'Copied' : 'Copy Mermaid Markdown'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMermaidModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
