import React, { useState, useEffect, useCallback } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  Play,
  Layers,
  Check,
  Shield,
  CreditCard,
  KeyRound,
  User,
  LogOut,
  AlertCircle,
  FileCode,
  Package,
  Rocket,
  Calculator as CalcIcon,
  Bot,
  Sparkles,
  ArrowRight,
  Clock,
  History,
  Trash2,
  CheckCircle2,
  Code2,
  Cpu,
  Flame,
  Crosshair,
  MousePointerClick,
  Send,
  Wand2,
} from 'lucide-react';
import {
  GitEngineMode,
  SessionUser,
  RequirementsBaseline,
  WorkerTask,
  PlanningStage,
  ContractSchema,
  VisualEditTarget,
  VisualEditPatch,
} from '../types/agentforge';

export interface LiveAppPreviewProps {
  selectedPresetId: string;
  gitMode: GitEngineMode;
  productionUrl?: string;
  onDeployToProduction?: () => void;
  isDeployed?: boolean;
  requirementsBaseline?: RequirementsBaseline | null;
  featurePrompt?: string;
  tasks?: WorkerTask[];
  stage?: PlanningStage;
  contract?: ContractSchema;
  onRunSimulation?: () => void;
  isSimulating?: boolean;
  onVisualMicroEdit?: (target: VisualEditTarget, instruction: string) => void;
  visualPatches?: VisualEditPatch[];
}

interface CalcHistoryItem {
  id: string;
  expr: string;
  result: string;
  timestamp: string;
}

export const LiveAppPreview: React.FC<LiveAppPreviewProps> = ({
  selectedPresetId,
  gitMode,
  productionUrl = 'https://agentforge-demo.vercel.app',
  onDeployToProduction,
  isDeployed = false,
  requirementsBaseline,
  featurePrompt,
  tasks,
  stage = 'discovery',
  contract,
  onRunSimulation,
  isSimulating = false,
  onVisualMicroEdit,
  visualPatches = [],
}) => {
  const [deviceViewport, setDeviceViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'app_ui' | 'compiled_bundle'>('app_ui');
  const [runtimeSource, setRuntimeSource] = useState<'sandbox' | 'iframe'>(
    gitMode === 'live_github' ? 'iframe' : 'sandbox'
  );
  const [iframeKey, setIframeKey] = useState<number>(0);

  // ================= STATE: VISUAL EDITING (INSPECT & EDIT) =================
  const [isInspectMode, setIsInspectMode] = useState<boolean>(false);
  const [hoveredElement, setHoveredElement] = useState<VisualEditTarget | null>(null);
  const [selectedElement, setSelectedElement] = useState<VisualEditTarget | null>(null);
  const [microPromptText, setMicroPromptText] = useState<string>('');
  const [isApplyingMicroEdit, setIsApplyingMicroEdit] = useState<boolean>(false);
  const [editSuccessFeedback, setEditSuccessFeedback] = useState<string | null>(null);
  const [customElementStyles, setCustomElementStyles] = useState<Record<string, string>>({});
  const [customElementTexts, setCustomElementTexts] = useState<Record<string, string>>({});

  const microSuggestions = [
    'Change this button to red',
    'Change to emerald gradient',
    'Make text bolder',
    'Add glowing border effect',
    'Change label to "Continue"',
  ];

  const getInspectProps = (id: string, label: string, componentName: string) => {
    if (!isInspectMode) return {};
    const isHovered = hoveredElement?.id === id;
    const isSelected = selectedElement?.id === id;
    return {
      onMouseEnter: (e: React.MouseEvent) => {
        e.stopPropagation();
        setHoveredElement({ id, label, componentName });
      },
      onMouseLeave: (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hoveredElement?.id === id) setHoveredElement(null);
      },
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedElement({ id, label, componentName });
        setMicroPromptText('');
      },
      className: `relative transition-all cursor-crosshair ${
        isSelected
          ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900'
          : isHovered
          ? 'ring-2 ring-indigo-400/80 ring-offset-1 ring-offset-slate-900'
          : 'hover:outline-dashed hover:outline-1 hover:outline-cyan-400/60'
      }`,
    };
  };

  const handleMicroEditSubmit = () => {
    if (!selectedElement || !microPromptText.trim()) return;
    setIsApplyingMicroEdit(true);

    const promptLower = microPromptText.toLowerCase();
    const targetId = selectedElement.id;

    // Apply visual styling
    setCustomElementStyles((prev) => {
      let newStyle = '';
      if (promptLower.includes('red') || promptLower.includes('rose')) {
        newStyle = 'bg-rose-600 text-white hover:bg-rose-500 border-rose-500 shadow-rose-900/40 ring-rose-500';
      } else if (promptLower.includes('emerald') || promptLower.includes('green')) {
        newStyle = 'bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-500 shadow-emerald-900/40 ring-emerald-500';
      } else if (promptLower.includes('purple') || promptLower.includes('violet')) {
        newStyle = 'bg-purple-600 text-white hover:bg-purple-500 border-purple-500 shadow-purple-900/40 ring-purple-500';
      } else if (promptLower.includes('amber') || promptLower.includes('orange')) {
        newStyle = 'bg-amber-600 text-white hover:bg-amber-500 border-amber-500 shadow-amber-900/40 ring-amber-500';
      } else if (promptLower.includes('cyan') || promptLower.includes('teal')) {
        newStyle = 'bg-cyan-600 text-white hover:bg-cyan-500 border-cyan-500 shadow-cyan-900/40 ring-cyan-500';
      } else if (promptLower.includes('glow') || promptLower.includes('gradient')) {
        newStyle = 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50';
      } else if (promptLower.includes('bold')) {
        newStyle = 'font-black tracking-wider uppercase';
      } else if (promptLower.includes('pill') || promptLower.includes('rounded')) {
        newStyle = 'rounded-full px-6 py-3';
      }
      return { ...prev, [targetId]: newStyle };
    });

    if (
      promptLower.includes('label') ||
      promptLower.includes('text') ||
      promptLower.includes('rename') ||
      promptLower.includes('continue')
    ) {
      const match = microPromptText.match(/['"](.*?)['"]/);
      if (match && match[1]) {
        setCustomElementTexts((prev) => ({ ...prev, [targetId]: match[1] }));
      } else if (promptLower.includes('continue')) {
        setCustomElementTexts((prev) => ({ ...prev, [targetId]: 'Continue' }));
      }
    }

    onVisualMicroEdit?.(selectedElement, microPromptText.trim());
    setEditSuccessFeedback(
      `Frontend Worker updated <${selectedElement.componentName}>: "${microPromptText.trim()}"`
    );

    setTimeout(() => {
      setIsApplyingMicroEdit(false);
      setSelectedElement(null);
      setMicroPromptText('');
    }, 600);
    setTimeout(() => setEditSuccessFeedback(null), 4000);
  };

  // Sync runtimeSource when gitMode changes
  useEffect(() => {
    setRuntimeSource(gitMode === 'live_github' ? 'iframe' : 'sandbox');
  }, [gitMode]);

  // Find frontend worker task
  const frontendTask = tasks?.find((t) => t.persona === 'frontend');
  const backendTask = tasks?.find((t) => t.persona === 'backend');
  const qaTask = tasks?.find((t) => t.persona === 'qa');
  const leadTask = tasks?.find((t) => t.persona === 'lead');

  // Determine whether any feature has been merged or if it's currently merged
  const isFeatureMerged =
    stage === 'merged' ||
    isDeployed ||
    (frontendTask?.status === 'completed' &&
      stage !== 'discovery' &&
      stage !== 'requirements_approval' &&
      stage !== 'task_planning' &&
      stage !== 'contract_freeze');

  // Detect active feature domain
  const getActiveFeatureDomain = useCallback((): 'calculator' | 'auth' | 'stripe' | 'rbac' | 'custom' => {
    const promptLower = (featurePrompt || '').toLowerCase();
    const baselineReqs = (requirementsBaseline?.functionalRequirements || []).join(' ').toLowerCase();
    const frontendFiles = (frontendTask?.permittedFiles || []).join(' ').toLowerCase();
    const combined = `${promptLower} ${baselineReqs} ${frontendFiles} ${selectedPresetId}`.toLowerCase();

    if (combined.includes('calc') || frontendFiles.includes('calculator')) {
      return 'calculator';
    }
    if (combined.includes('stripe') || combined.includes('billing') || combined.includes('checkout') || frontendFiles.includes('pricing')) {
      return 'stripe';
    }
    if (combined.includes('rbac') || combined.includes('role') || combined.includes('permission') || combined.includes('team') || frontendFiles.includes('team')) {
      return 'rbac';
    }
    if (combined.includes('auth') || combined.includes('login') || combined.includes('session') || combined.includes('jwt') || frontendFiles.includes('login') || selectedPresetId === 'auth') {
      return 'auth';
    }
    return 'custom';
  }, [featurePrompt, requirementsBaseline, frontendTask, selectedPresetId]);

  const activeDomain = getActiveFeatureDomain();

  // URL Path display in browser bar
  const getInitialUrlPath = useCallback(() => {
    if (!isFeatureMerged) return '/';
    switch (activeDomain) {
      case 'calculator':
        return '/calculator';
      case 'stripe':
        return '/pricing';
      case 'rbac':
        return '/teams';
      case 'auth':
        return '/login';
      case 'custom':
      default:
        return '/app';
    }
  }, [isFeatureMerged, activeDomain]);

  const [urlPath, setUrlPath] = useState<string>(getInitialUrlPath());

  useEffect(() => {
    setUrlPath(getInitialUrlPath());
  }, [getInitialUrlPath]);

  // ================= STATE: CALCULATOR =================
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [calcPrevEquation, setCalcPrevEquation] = useState<string>('');
  const [calcPrevValue, setCalcPrevValue] = useState<number | null>(null);
  const [calcOperator, setCalcOperator] = useState<string | null>(null);
  const [calcWaitingForOperand, setCalcWaitingForOperand] = useState<boolean>(false);
  const [calcMemory, setCalcMemory] = useState<number>(0);
  const [calcHistory, setCalcHistory] = useState<CalcHistoryItem[]>([
    { id: 'h1', expr: '125 × 4', result: '500', timestamp: '10:42 AM' },
    { id: 'h2', expr: '2,400 ÷ 12', result: '200', timestamp: '10:44 AM' },
  ]);
  const [showCalcHistory, setShowCalcHistory] = useState<boolean>(false);

  // Safe floating point rounding to 10 decimal digits
  const roundPrecision = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 1e10) / 1e10;
  };

  const handleCalcDigit = (digit: string) => {
    if (calcWaitingForOperand) {
      setCalcDisplay(digit);
      setCalcWaitingForOperand(false);
    } else {
      setCalcDisplay(calcDisplay === '0' ? digit : calcDisplay + digit);
    }
  };

  const handleCalcDecimal = () => {
    if (calcWaitingForOperand) {
      setCalcDisplay('0.');
      setCalcWaitingForOperand(false);
      return;
    }
    if (!calcDisplay.includes('.')) {
      setCalcDisplay(calcDisplay + '.');
    }
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcPrevEquation('');
    setCalcPrevValue(null);
    setCalcOperator(null);
    setCalcWaitingForOperand(false);
  };

  const handleCalcToggleSign = () => {
    const val = parseFloat(calcDisplay);
    if (!isNaN(val)) {
      setCalcDisplay(String(-val));
    }
  };

  const handleCalcPercent = () => {
    const val = parseFloat(calcDisplay);
    if (!isNaN(val)) {
      setCalcDisplay(String(roundPrecision(val / 100)));
    }
  };

  const handleCalcScientific = (fn: 'sqrt' | 'sqr' | 'recip') => {
    const val = parseFloat(calcDisplay);
    if (isNaN(val)) return;

    let res = 0;
    let label = '';
    if (fn === 'sqrt') {
      if (val < 0) {
        setCalcDisplay('Invalid input');
        setCalcWaitingForOperand(true);
        return;
      }
      res = roundPrecision(Math.sqrt(val));
      label = `√(${val})`;
    } else if (fn === 'sqr') {
      res = roundPrecision(val * val);
      label = `sqr(${val})`;
    } else if (fn === 'recip') {
      if (val === 0) {
        setCalcDisplay('Cannot divide by zero');
        setCalcWaitingForOperand(true);
        return;
      }
      res = roundPrecision(1 / val);
      label = `1/(${val})`;
    }

    setCalcPrevEquation(label);
    setCalcDisplay(String(res));
    setCalcWaitingForOperand(true);
  };

  const performCalcOperation = (nextOp: string) => {
    const inputValue = parseFloat(calcDisplay);

    if (calcPrevValue === null) {
      setCalcPrevValue(inputValue);
      setCalcPrevEquation(`${calcDisplay} ${nextOp}`);
    } else if (calcOperator) {
      const current = calcPrevValue;
      let computed = 0;

      switch (calcOperator) {
        case '+':
          computed = roundPrecision(current + inputValue);
          break;
        case '−':
        case '-':
          computed = roundPrecision(current - inputValue);
          break;
        case '×':
        case '*':
          computed = roundPrecision(current * inputValue);
          break;
        case '÷':
        case '/':
          if (inputValue === 0) {
            setCalcDisplay('Cannot divide by zero');
            setCalcPrevEquation(`${current} ÷ 0`);
            setCalcPrevValue(null);
            setCalcOperator(null);
            setCalcWaitingForOperand(true);
            return;
          }
          computed = roundPrecision(current / inputValue);
          break;
        default:
          computed = inputValue;
      }

      setCalcPrevValue(computed);
      setCalcDisplay(String(computed));
      setCalcPrevEquation(`${computed} ${nextOp}`);
    }

    setCalcWaitingForOperand(true);
    setCalcOperator(nextOp);
  };

  const handleCalcEquals = () => {
    const inputValue = parseFloat(calcDisplay);

    if (calcPrevValue !== null && calcOperator) {
      let computed = 0;
      switch (calcOperator) {
        case '+':
          computed = roundPrecision(calcPrevValue + inputValue);
          break;
        case '−':
        case '-':
          computed = roundPrecision(calcPrevValue - inputValue);
          break;
        case '×':
        case '*':
          computed = roundPrecision(calcPrevValue * inputValue);
          break;
        case '÷':
        case '/':
          if (inputValue === 0) {
            setCalcDisplay('Cannot divide by zero');
            setCalcPrevEquation(`${calcPrevValue} ÷ 0`);
            setCalcPrevValue(null);
            setCalcOperator(null);
            setCalcWaitingForOperand(true);
            return;
          }
          computed = roundPrecision(calcPrevValue / inputValue);
          break;
        default:
          computed = inputValue;
      }

      const expression = `${calcPrevValue} ${calcOperator} ${inputValue}`;
      setCalcPrevEquation(`${expression} =`);
      setCalcDisplay(String(computed));

      // Append to history
      const newHistoryItem: CalcHistoryItem = {
        id: `h-${Date.now()}`,
        expr: expression,
        result: String(computed),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setCalcHistory((prev) => [newHistoryItem, ...prev.slice(0, 19)]);

      setCalcPrevValue(null);
      setCalcOperator(null);
      setCalcWaitingForOperand(true);
    }
  };

  // Memory keys
  const handleMemory = (action: 'mc' | 'mr' | 'm+' | 'm-') => {
    const val = parseFloat(calcDisplay) || 0;
    if (action === 'mc') {
      setCalcMemory(0);
    } else if (action === 'mr') {
      setCalcDisplay(String(calcMemory));
      setCalcWaitingForOperand(true);
    } else if (action === 'm+') {
      setCalcMemory((m) => roundPrecision(m + val));
      setCalcWaitingForOperand(true);
    } else if (action === 'm-') {
      setCalcMemory((m) => roundPrecision(m - val));
      setCalcWaitingForOperand(true);
    }
  };

  // Keyboard shortcut listener for Calculator
  useEffect(() => {
    if (activeDomain !== 'calculator' || !isFeatureMerged) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input fields
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        handleCalcDigit(e.key);
      } else if (e.key === '.') {
        handleCalcDecimal();
      } else if (e.key === '+' || e.key === '-') {
        performCalcOperation(e.key === '-' ? '−' : '+');
      } else if (e.key === '*') {
        performCalcOperation('×');
      } else if (e.key === '/') {
        e.preventDefault();
        performCalcOperation('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalcEquals();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handleCalcClear();
      } else if (e.key === 'Backspace') {
        if (!calcWaitingForOperand && calcDisplay.length > 1) {
          setCalcDisplay(calcDisplay.slice(0, -1));
        } else {
          setCalcDisplay('0');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeDomain, isFeatureMerged, calcDisplay, calcWaitingForOperand, calcPrevValue, calcOperator]);

  // ================= STATE: AUTH SANDBOX =================
  const [email, setEmail] = useState('alex@agentforge.dev');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser] = useState<SessionUser>({
    id: 'usr_8921a',
    email: 'alex@agentforge.dev',
    displayName: 'Alex Rivera',
    roles: ['admin', 'member'],
    createdAt: '2026-10-10T07:20:00Z',
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);

    setTimeout(() => {
      if (email.toLowerCase().includes('error')) {
        setAuthError('401 ERR_UNAUTHORIZED: Invalid credentials provided.');
        setIsSubmitting(false);
      } else {
        setIsAuthenticated(true);
        setIsSubmitting(false);
        setUrlPath('/dashboard');
      }
    }, 500);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUrlPath('/login');
  };

  // ================= STATE: STRIPE SANDBOX =================
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);

  const handleCheckout = (tierName: string) => {
    const sessId = `cs_live_${Date.now()}_${tierName.toLowerCase()}`;
    setCheckoutSessionId(sessId);
    setUrlPath(`/billing/success?session_id=${sessId}`);
  };

  // ================= STATE: RBAC SANDBOX =================
  const [teamMembers, setTeamMembers] = useState([
    { id: 'u1', name: 'Alex Rivera', email: 'alex@agentforge.dev', role: 'owner' as const },
    { id: 'u2', name: 'Sara Lin', email: 'sara@agentforge.dev', role: 'admin' as const },
    { id: 'u3', name: 'Devon Vance', email: 'devon@agentforge.dev', role: 'developer' as const },
    { id: 'u4', name: 'Morgan Cruz', email: 'morgan@agentforge.dev', role: 'viewer' as const },
  ]);

  const handleRoleChange = (memberId: string, newRole: any) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  };

  const resetSandbox = () => {
    setIsAuthenticated(false);
    setAuthError(null);
    setCheckoutSessionId(null);
    handleCalcClear();
    setUrlPath(getInitialUrlPath());
  };

  const getViewportWidthClass = () => {
    switch (deviceViewport) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  // Dynamic route manifest list for Compiled Bundle view
  const getBundleRoutes = () => {
    switch (activeDomain) {
      case 'calculator':
        return [
          { path: '┌ ○ /calculator', size: '28.2 kB (gzip 8.4 kB)', tag: 'Static (SSG)' },
          { path: '├ λ /api/v1/calculator/evaluate', size: '1.2 kB (Edge Runtime)', tag: 'Serverless', highlight: true },
          { path: '└ λ /api/v1/calculator/history', size: '1.4 kB (Edge Runtime)', tag: 'Serverless', highlight: true },
        ];
      case 'stripe':
        return [
          { path: '┌ ○ /pricing', size: '32.1 kB (gzip 9.8 kB)', tag: 'Static' },
          { path: '├ ○ /billing/success', size: '18.4 kB (gzip 5.6 kB)', tag: 'Static' },
          { path: '├ λ /api/v1/billing/checkout', size: '2.1 kB (Edge Runtime)', tag: 'Serverless', highlight: true },
          { path: '└ λ /api/v1/billing/webhooks', size: '2.4 kB (Node Runtime)', tag: 'Raw HMAC', highlight: true },
        ];
      case 'rbac':
        return [
          { path: '┌ ○ /teams', size: '36.5 kB (gzip 10.4 kB)', tag: 'Static' },
          { path: '├ λ /api/v1/teams/:teamId/members', size: '1.6 kB (Edge Runtime)', tag: 'Serverless', highlight: true },
          { path: '└ λ /api/v1/teams/:teamId/members/:userId', size: '1.9 kB (Edge Runtime)', tag: 'Serverless', highlight: true },
        ];
      case 'auth':
      default:
        return [
          { path: '┌ ○ /login', size: '38.4 kB (gzip 11.2 kB)', tag: 'Static' },
          { path: '├ ○ /dashboard', size: '42.1 kB (gzip 12.4 kB)', tag: 'Protected' },
          { path: '├ λ /api/auth/login', size: '1.8 kB (Edge Runtime)', tag: 'Serverless', highlight: true },
          { path: '├ λ /api/auth/session', size: '1.4 kB (Edge Runtime)', tag: 'Serverless', highlight: true },
          { path: '└ λ /api/auth/logout', size: '0.9 kB (Edge Runtime)', tag: 'Serverless', highlight: true },
        ];
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden select-text">
      {/* Top Controls Toolbar: Device Selector, View Mode Switcher & URL Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        {/* Left: View Mode Segmented Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('app_ui')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              viewMode === 'app_ui'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>Preview App UI</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('compiled_bundle')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              viewMode === 'compiled_bundle'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3 h-3" />
            <span>Next.js Bundle Manifest</span>
          </button>
        </div>

        {/* Center: Device Viewport Controls */}
        {viewMode === 'app_ui' && (
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setDeviceViewport('desktop')}
              title="Desktop viewport (100% width)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                deviceViewport === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceViewport('tablet')}
              title="Tablet viewport (768px width)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                deviceViewport === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceViewport('mobile')}
              title="Mobile viewport (375px width)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                deviceViewport === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Inspect & Edit Button, Runtime Status Chip & Reload */}
        <div className="flex items-center gap-2">
          {/* 🎯 Inspect & Edit Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsInspectMode(!isInspectMode);
              setSelectedElement(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isInspectMode
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-400'
                : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
            }`}
            title="Inspect & Edit components directly with targeted micro-prompts to Frontend Worker"
          >
            <Crosshair
              className={`w-3.5 h-3.5 ${
                isInspectMode ? 'animate-pulse text-cyan-400' : 'text-slate-400'
              }`}
            />
            <span>{isInspectMode ? 'Inspect & Edit: ON' : 'Inspect & Edit'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetSandbox();
              setIframeKey((k) => k + 1);
            }}
            title="Reload sandbox / iframe preview"
            className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isDeployed
                ? 'Production: Live'
                : isFeatureMerged
                ? 'Runtime: Active'
                : 'Next.js Dev Server'}
            </span>
          </span>

          <a
            href={productionUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new window"
            className="p-1 text-slate-400 hover:text-indigo-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Browser Location Bar with Dual Mode Source Switcher */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900/60 border-b border-slate-800/80 text-[11px] font-mono shrink-0">
        <span className="text-slate-500">http://localhost:3000</span>
        <span className="text-slate-200 font-medium">{urlPath}</span>

        <div className="ml-auto flex items-center gap-2">
          {frontendTask && (
            <span className="text-[10px] text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40 hidden sm:inline-flex items-center gap-1">
              <Bot className="w-3 h-3 text-indigo-400" />
              <span>{frontendTask.title}</span>
            </span>
          )}

          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setRuntimeSource('sandbox')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                runtimeSource === 'sandbox'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Virtual Sandbox
            </button>
            <button
              type="button"
              onClick={() => setRuntimeSource('iframe')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                runtimeSource === 'iframe'
                  ? 'bg-sky-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hosted Iframe
            </button>
          </div>
        </div>
      </div>

      {/* 🎯 Inspect Mode Active Banner */}
      {isInspectMode && (
        <div className="px-4 py-1.5 bg-cyan-950/60 border-b border-cyan-800/80 flex items-center justify-between text-xs text-cyan-200 shrink-0">
          <div className="flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
            <span className="font-semibold text-white">Inspect & Edit Mode Active:</span>
            <span className="text-cyan-300 hidden sm:inline">
              Hover over components to highlight, click to dispatch micro-prompts directly to Frontend Worker.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsInspectMode(false);
              setSelectedElement(null);
            }}
            className="text-[11px] font-mono underline text-cyan-400 hover:text-cyan-200 cursor-pointer"
          >
            Exit Inspect
          </button>
        </div>
      )}

      {/* Micro-edit Success Toast */}
      {editSuccessFeedback && (
        <div className="px-4 py-1.5 bg-emerald-950/80 border-b border-emerald-800 flex items-center gap-2 text-xs text-emerald-200 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-medium">{editSuccessFeedback}</span>
        </div>
      )}

      {/* 4. Ensure Sync: Frontend Worker Component Sync Banner */}
      {isFeatureMerged && frontendTask && (
        <div className="px-4 py-1.5 bg-indigo-950/30 border-b border-indigo-900/40 flex flex-wrap items-center justify-between text-[11px] text-indigo-200 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">Mounted Components:</span>
            <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
              {(frontendTask.permittedFiles || []).map((file) => (
                <span
                  key={file}
                  className="px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-800/40"
                >
                  {file}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>Branch: <span className="text-slate-300">{frontendTask.branch}</span></span>
            <span>•</span>
            <span>Contract: <span className="text-emerald-400 font-semibold">{contract?.version || 'v1.0.0'}</span></span>
          </div>
        </div>
      )}

      {/* Main Preview Container Viewport */}
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-start bg-slate-950/90">
        {viewMode === 'app_ui' ? (
          runtimeSource === 'iframe' ? (
            /* ================= LIVE HOSTED IFRAME ================= */
            <div
              className={`transition-all duration-200 mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col ${getViewportWidthClass()} h-[600px]`}
            >
              <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-sky-300 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  <span>Hosted WebContainer: {productionUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRuntimeSource('sandbox')}
                  className="text-[10px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                >
                  Switch to Sandbox
                </button>
              </div>
              <div className="flex-1 w-full bg-slate-950 relative">
                <iframe
                  key={iframeKey}
                  src={productionUrl}
                  title="Live Hosted Application Preview"
                  className="w-full h-full border-0 bg-slate-950"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>
            </div>
          ) : !isFeatureMerged ? (
            /* ================= 3. EMPTY / DEFAULT STATE PLACEHOLDER ================= */
            /* "Welcome to your Next.js App - Waiting for Agents to build UI..." Screen */
            <div
              className={`transition-all duration-200 mx-auto bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center max-w-2xl w-full my-auto`}
            >
              {/* Next.js Badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white">Next.js 15 App Router</span>
                <span className="text-slate-600">·</span>
                <span>Node.js 20 Active</span>
                <span className="text-slate-600">·</span>
                <span className="text-indigo-400">Port 3000</span>
              </div>

              {/* Hero Icon */}
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-900/50 to-slate-800 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg">
                  <Bot className="w-8 h-8 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Required Headings */}
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Welcome to your Next.js App
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md">
                Waiting for Agents to build UI...
              </p>

              {/* Pipeline Status Indicator Card */}
              <div className="w-full mt-6 p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-left flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-900">
                  <span className="text-slate-400 font-mono">Agent Pipeline Status</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                    {stage === 'discovery' || stage === 'requirements_approval'
                      ? 'Gate 1: Requirements Discovery'
                      : stage === 'task_planning'
                      ? 'Gate 2: Task Decomposition'
                      : stage === 'contract_freeze'
                      ? 'Gate 3: Contract Awaiting Approval'
                      : stage === 'executing'
                      ? 'Workers Coding in Parallel'
                      : stage === 'ci_waiting' || stage === 'ci_failed'
                      ? 'CI Automated Verification'
                      : 'Lead Architect Online'}
                  </span>
                </div>

                {featurePrompt ? (
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Active Feature Request:
                    </span>
                    <p className="text-slate-200 font-sans bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/60 text-xs leading-relaxed">
                      &ldquo;{featurePrompt}&rdquo;
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">
                    No feature requested yet. Type your desired feature in the Lead Architect Chat or select an Architectural Suggestion to begin.
                  </div>
                )}

                {/* Agent Task Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 flex flex-col">
                    <span className="text-slate-500 text-[10px]">Lead Architect</span>
                    <span className="text-indigo-300 font-medium truncate">
                      {leadTask?.status === 'completed' ? '✓ Baseline Ready' : 'Discovery'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 flex flex-col">
                    <span className="text-slate-500 text-[10px]">Frontend Worker</span>
                    <span className="text-slate-300 font-medium truncate">
                      {frontendTask?.status === 'coding'
                        ? 'Writing Components'
                        : frontendTask?.status === 'completed'
                        ? '✓ Ready to Mount'
                        : 'Awaiting Contract'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 flex flex-col">
                    <span className="text-slate-500 text-[10px]">Backend Worker</span>
                    <span className="text-slate-300 font-medium truncate">
                      {backendTask?.status === 'completed' ? '✓ Routes Validated' : 'Awaiting Contract'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 flex flex-col">
                    <span className="text-slate-500 text-[10px]">QA Worker</span>
                    <span className="text-slate-300 font-medium truncate">
                      {qaTask?.status === 'completed' ? '✓ Tests Passed' : 'Tests Queued'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fast-Track Simulation Button */}
              {onRunSimulation && (
                <button
                  type="button"
                  onClick={onRunSimulation}
                  disabled={isSimulating}
                  className="mt-6 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:from-indigo-700 active:to-sky-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>
                    {isSimulating ? 'Agents Building Feature...' : 'Simulate Multi-Agent Lifecycle & Render UI'}
                  </span>
                </button>
              )}
            </div>
          ) : (
            /* ================= DYNAMIC COMPONENT RENDERING ================= */
            /* Renders the actual generated feature from Frontend Worker */
            <div
              className={`transition-all duration-200 mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden ${getViewportWidthClass()} flex flex-col`}
            >
              {/* FEATURE 1: CALCULATOR COMPONENT */}
              {activeDomain === 'calculator' && (
                <div className="p-4 sm:p-6 flex flex-col items-center max-w-md mx-auto w-full">
                  {/* Calculator Header */}
                  <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                        <CalcIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Modern Calculator</h3>
                        <p className="text-[10px] text-slate-400 font-mono">IEEE 754 Safe Precision</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCalcHistory(!showCalcHistory)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                        showCalcHistory
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                      title="Toggle calculation history"
                    >
                      <History className="w-3 h-3" />
                      <span>History</span>
                      {calcHistory.length > 0 && (
                        <span className="text-[9px] px-1 rounded-full bg-slate-800 text-slate-300">
                          {calcHistory.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Calculator Body */}
                  <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col gap-3 shadow-inner">
                    {/* Screen / Display */}
                    <div className="w-full bg-slate-900/90 rounded-xl border border-slate-800/80 p-3 text-right flex flex-col justify-end min-h-[76px]">
                      <div className="text-xs font-mono text-slate-500 h-4 truncate">
                        {calcPrevEquation || '\u00A0'}
                      </div>
                      <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider truncate">
                        {calcDisplay}
                      </div>
                    </div>

                    {/* Memory Registers Row */}
                    <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => handleMemory('mc')}
                        className="py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px]"
                      >
                        MC
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMemory('mr')}
                        className="py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px]"
                      >
                        MR {calcMemory !== 0 && '•'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMemory('m+')}
                        className="py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px]"
                      >
                        M+
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMemory('m-')}
                        className="py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px]"
                      >
                        M-
                      </button>
                    </div>

                    {/* Scientific Functions Row */}
                    <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => handleCalcScientific('sqrt')}
                        className="py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-indigo-300 font-medium transition-colors cursor-pointer"
                      >
                        √x
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCalcScientific('sqr')}
                        className="py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-indigo-300 font-medium transition-colors cursor-pointer"
                      >
                        x²
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCalcScientific('recip')}
                        className="py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-indigo-300 font-medium transition-colors cursor-pointer"
                      >
                        1/x
                      </button>
                      <button
                        type="button"
                        onClick={handleCalcPercent}
                        className="py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-indigo-300 font-medium transition-colors cursor-pointer"
                      >
                        %
                      </button>
                    </div>

                    {/* Primary Numeric Keypad */}
                    <div className="grid grid-cols-4 gap-2 text-sm font-semibold font-mono">
                      {/* Row 1 */}
                      <button
                        type="button"
                        onClick={handleCalcClear}
                        className="p-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
                      >
                        C
                      </button>
                      <button
                        type="button"
                        onClick={handleCalcToggleSign}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                      >
                        ±
                      </button>
                      <button
                        type="button"
                        onClick={() => performCalcOperation('÷')}
                        className="p-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-800/50 transition-colors cursor-pointer"
                      >
                        ÷
                      </button>
                      <button
                        type="button"
                        onClick={() => performCalcOperation('×')}
                        className="p-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-800/50 transition-colors cursor-pointer"
                      >
                        ×
                      </button>

                      {/* Row 2 */}
                      <button
                        type="button"
                        onClick={() => handleCalcDigit('7')}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800/80 transition-colors cursor-pointer"
                      >
                        7
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCalcDigit('8')}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800/80 transition-colors cursor-pointer"
                      >
                        8
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCalcDigit('9')}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800/80 transition-colors cursor-pointer"
                      >
                        9
                      </button>
                      <button
                        type="button"
                        onClick={() => performCalcOperation('−')}
                        className="p-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-800/50 transition-colors cursor-pointer"
                      >
                        −
                      </button>

                      {/* Row 3 */}
                      <button
                        type="button"
                        onClick={() => handleCalcDigit('4')}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800/80 transition-colors cursor-pointer"
                      >
                        4
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCalcDigit('5')}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800/80 transition-colors cursor-pointer"
                      >
                        5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCalcDigit('6')}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800/80 transition-colors cursor-pointer"
                      >
                        6
                      </button>
                      <button
                        type="button"
                        onClick={() => performCalcOperation('+')}
                        className="p-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-800/50 transition-colors cursor-pointer"
                      >
                        +
                      </button>

                      {/* Row 4 */}
                      <button
                        type="button"
                        onClick={() => handleCalcDigit('1')}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800/80 transition-colors cursor-pointer"
                      >
                        1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCalcDigit('2')}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800/80 transition-colors cursor-pointer"
                      >
                        2
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCalcDigit('3')}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800/80 transition-colors cursor-pointer"
                      >
                        3
                      </button>
                      <button
                        type="button"
                        onClick={handleCalcEquals}
                        className="row-span-2 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold flex items-center justify-center transition-colors shadow-md shadow-indigo-600/30 cursor-pointer"
                      >
                        =
                      </button>

                      {/* Row 5 */}
                      <button
                        type="button"
                        onClick={() => handleCalcDigit('0')}
                        className="col-span-2 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800/80 transition-colors cursor-pointer"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={handleCalcDecimal}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800/80 transition-colors cursor-pointer"
                      >
                        .
                      </button>
                    </div>
                  </div>

                  {/* History Drawer */}
                  {showCalcHistory && (
                    <div className="w-full mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-900">
                        <span className="font-semibold text-slate-300">Calculation Ledger</span>
                        {calcHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setCalcHistory([])}
                            className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {calcHistory.length === 0 ? (
                          <div className="text-center py-3 text-[11px] text-slate-500 font-mono">
                            No past calculations in ledger.
                          </div>
                        ) : (
                          calcHistory.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setCalcDisplay(item.result);
                                setCalcPrevEquation(item.expr + ' =');
                                setCalcWaitingForOperand(true);
                              }}
                              className="p-2 rounded bg-slate-900/60 hover:bg-indigo-950/40 border border-slate-800/60 flex items-center justify-between text-xs font-mono cursor-pointer transition-colors"
                              title="Click to restore result"
                            >
                              <div className="flex flex-col">
                                <span className="text-slate-400 text-[11px]">{item.expr} =</span>
                                <span className="text-white font-bold">{item.result}</span>
                              </div>
                              <span className="text-[10px] text-slate-600">{item.timestamp}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 text-[11px] text-slate-500 text-center font-mono">
                    Keypad supports keyboard shortcuts: (0-9, +, -, *, /, Enter, Backspace)
                  </div>
                </div>
              )}

              {/* FEATURE 2: USER AUTH & SESSIONS */}
              {activeDomain === 'auth' && (
                <div className="p-6 flex flex-col gap-5">
                  {!isAuthenticated ? (
                    <div className="max-w-md mx-auto w-full flex flex-col gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-white">AgentForge Authentication</h2>
                          <p className="text-xs text-slate-400">Strict adherence to contract v1.4.0 DTOs</p>
                        </div>
                      </div>

                      {authError && (
                        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>{authError}</span>
                        </div>
                      )}

                      <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            {...getInspectProps('input-email', 'Email Address Input', 'LoginForm')}
                            className={`w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono ${
                              customElementStyles['input-email'] || ''
                            }`}
                            placeholder="alex@agentforge.dev"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Password
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            {...getInspectProps('input-password', 'Password Input', 'LoginForm')}
                            className={`w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono ${
                              customElementStyles['input-password'] || ''
                            }`}
                            required
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="rounded bg-slate-950 border-slate-800 accent-indigo-600"
                            />
                            <span>Remember session (30 days)</span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          {...getInspectProps('btn-login-submit', 'Submit Button', 'LoginForm')}
                          className={`w-full py-2.5 ${
                            customElementStyles['btn-login-submit'] ||
                            'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700'
                          } text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md`}
                        >
                          {customElementTexts['btn-login-submit'] ||
                            (isSubmitting
                              ? 'Validating Token & Contract...'
                              : 'Sign In with Session JWT')}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div>
                          <h2 className="text-base font-bold text-white">Developer Dashboard</h2>
                          <span className="text-xs text-emerald-400 font-mono">
                            Active Session Cookie: HttpOnly · Secure · SameSite=Lax
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white">
                            {currentUser.displayName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{currentUser.displayName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{currentUser.email}</span>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[11px] text-slate-500">
                          <div>User ID: {currentUser.id}</div>
                          <div className="text-emerald-400">JWT Verified</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FEATURE 3: STRIPE CHECKOUT */}
              {activeDomain === 'stripe' && (
                <div className="p-6 flex flex-col gap-5">
                  <div className="flex flex-col items-center text-center max-w-md mx-auto">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white mb-2">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-white">Flexible Pricing Plans</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Integrated with Stripe Hosted Checkout & Webhook Ledger
                    </p>

                    <div className="flex items-center gap-2 mt-4 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setBillingInterval('monthly')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          billingInterval === 'monthly' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingInterval('annual')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          billingInterval === 'annual' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'
                        }`}
                      >
                        Annual (20% off)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { name: 'Starter', price: billingInterval === 'monthly' ? '$19' : '$15', desc: 'For early prototypes' },
                      { name: 'Pro', price: billingInterval === 'monthly' ? '$49' : '$39', desc: 'For scaling teams', popular: true },
                      { name: 'Enterprise', price: billingInterval === 'monthly' ? '$199' : '$159', desc: 'Dedicated cluster SLA' },
                    ].map((plan) => (
                      <div
                        key={plan.name}
                        className={`p-4 rounded-xl border flex flex-col justify-between ${
                          plan.popular
                            ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/30'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{plan.name}</span>
                            {plan.popular && (
                              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-800/40">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="text-lg font-bold text-white mt-2">
                            {plan.price}
                            <span className="text-xs text-slate-500 font-normal">/mo</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{plan.desc}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCheckout(plan.name)}
                          className={`w-full py-1.5 mt-4 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            plan.popular
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          Start Checkout
                        </button>
                      </div>
                    ))}
                  </div>

                  {checkoutSessionId && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 font-mono">
                      ✔ Hosted Session Created: {checkoutSessionId}
                    </div>
                  )}
                </div>
              )}

              {/* FEATURE 4: TEAM RBAC */}
              {activeDomain === 'rbac' && (
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">Team Member Permissions</h2>
                        <p className="text-xs text-slate-400">Strict hierarchical role enforcement</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                      4 Active Members
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800">
                    {teamMembers.map((m) => (
                      <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                            {m.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-slate-200 truncate">{m.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono truncate">{m.email}</span>
                          </div>
                        </div>

                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded text-xs font-mono text-indigo-300 px-2 py-1 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="owner">Owner (Highest)</option>
                          <option value="admin">Admin</option>
                          <option value="developer">Developer</option>
                          <option value="viewer">Viewer (Read-Only)</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FEATURE 5: CUSTOM DYNAMIC FEATURE */}
              {activeDomain === 'custom' && (
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Dynamic Feature Container</h2>
                      <p className="text-xs text-slate-400">Compiled from Requirements Baseline</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-slate-300">Verified Requirements:</span>
                    <ul className="space-y-1.5 text-xs text-slate-400">
                      {(requirementsBaseline?.functionalRequirements || [
                        'Client UI components strictly consuming frozen props',
                        'Server API endpoints validated with zero schema drift',
                      ]).map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* ================= INSPECT COMPILED BUNDLE MANIFEST ================= */
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-5 font-mono text-xs text-slate-300 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Package className="w-4 h-4 text-indigo-400" />
                <span>Next.js Production Build Output Manifest</span>
              </div>
              <span className="text-[11px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                Size Optimized: {activeDomain === 'calculator' ? '98 kB total' : '142 kB total'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-[11px]">
              <div className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Route (app) & Serverless Endpoints:
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col gap-1.5 leading-relaxed">
                {getBundleRoutes().map((r, i) => (
                  <div key={i} className={`flex justify-between ${r.highlight ? 'text-indigo-300 font-semibold' : 'text-slate-300'}`}>
                    <span>{r.path}</span>
                    <span className={r.highlight ? 'text-emerald-400' : 'text-slate-500'}>{r.size}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col gap-1">
                <span className="text-slate-500 font-bold">Frontend Components:</span>
                <span className="text-slate-300">
                  {(frontendTask?.permittedFiles || ['src/components/App.tsx']).join(', ')}
                </span>
                <span className="text-emerald-400">Strictly mapped to Frontend Worker PR</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col gap-1">
                <span className="text-slate-500 font-bold">Shared Contract Chunk:</span>
                <span className="text-slate-300">types/contracts.ts ({contract?.version || 'v1.0.0'})</span>
                <span className="text-emerald-400">0 unreferenced exports</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Deployment Callout Banner */}
        {!isDeployed && onDeployToProduction && isFeatureMerged && (
          <div className="w-full max-w-3xl mt-4 p-3.5 bg-indigo-950/40 border border-indigo-800/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-2.5 text-indigo-200">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                <Rocket className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white">Pipeline Stage 5: Ready for Production</span>
                <p className="text-[11px] text-slate-400">Trigger one-click build and edge domain assignment to Vercel or Cloudflare.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDeployToProduction}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold rounded-lg shadow-sm whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Deploy to Production</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Micro-Prompt Modal for Visual Click-to-Edit */}
      {selectedElement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Frontend Worker Component Micro-Edit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedElement(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">TARGET COMPONENT</span>
                <span className="font-bold text-cyan-300 font-mono">&lt;{selectedElement.componentName}&gt;</span>
                <span className="text-slate-300 ml-1.5 font-medium">{selectedElement.label}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Direct Frontend Route
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Describe desired modification:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={microPromptText}
                  onChange={(e) => setMicroPromptText(e.target.value)}
                  placeholder="e.g. Change this button to red, make text bold, add glowing border..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleMicroEditSubmit();
                  }}
                />
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono text-slate-400">Quick presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {microSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setMicroPromptText(sug)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/80"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono">
                Bypasses Lead Pipeline · ~280 tokens
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedElement(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMicroEditSubmit}
                  disabled={!microPromptText.trim() || isApplyingMicroEdit}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
                >
                  {isApplyingMicroEdit ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Apply Patch</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
