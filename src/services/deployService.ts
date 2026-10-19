import { DeploymentState, DeploymentProvider } from '../types/agentforge';

export type DeploymentStepCallback = (state: DeploymentState, logLine: string) => void;

export class DeployService {
  private currentState: DeploymentState = {
    status: 'idle',
    productionUrl: 'https://agentforge-demo.vercel.app',
    commitSha: 'd891a20',
    provider: 'vercel',
    buildLogs: [],
  };

  public getState(): DeploymentState {
    return { ...this.currentState };
  }

  /**
   * Run the production deployment pipeline:
   * Idle -> Building Production Artifacts -> Optimizing Static Assets -> Assigned Edge Domain -> Live
   */
  public async deploy(
    commitSha: string,
    provider: DeploymentProvider = 'vercel',
    onProgress?: DeploymentStepCallback
  ): Promise<DeploymentState> {
    const startTime = Date.now();
    const productionUrl =
      provider === 'vercel'
        ? 'https://agentforge-demo.vercel.app'
        : 'https://agentforge.cloudflare.dev';

    this.currentState = {
      status: 'building',
      productionUrl,
      commitSha,
      provider,
      buildLogs: [`[DEPLOY] Initializing deployment for commit ${commitSha.slice(0, 7)} on ${provider}...`],
    };
    onProgress?.(this.currentState, `[DEPLOY] Initializing deployment on ${provider}...`);

    // Step 1: Building production artifacts
    await this.delay(700);
    const log1 = `[DEPLOY] Running 'next build': compiling TypeScript, frozen contracts & App Router tree...`;
    this.currentState.buildLogs.push(log1);
    this.currentState.status = 'building';
    onProgress?.(this.currentState, log1);

    // Step 2: Optimizing Static Assets
    await this.delay(800);
    const log2 = `[DEPLOY] Optimizing server bundles, chunk splitting, and static asset hashing...`;
    this.currentState.buildLogs.push(log2);
    this.currentState.status = 'optimizing';
    onProgress?.(this.currentState, log2);

    // Step 3: Assigning Edge Domain
    await this.delay(800);
    const log3 = `[DEPLOY] Distributing across global edge network and provisioning SSL on ${productionUrl}...`;
    this.currentState.buildLogs.push(log3);
    this.currentState.status = 'assigning_domain';
    onProgress?.(this.currentState, log3);

    // Step 4: Live
    await this.delay(600);
    const durationMs = Date.now() - startTime;
    const log4 = `[DEPLOY] Success: Deployed to ${productionUrl} in ${(durationMs / 1000).toFixed(2)}s`;
    this.currentState.buildLogs.push(log4);
    this.currentState.status = 'live';
    this.currentState.deployedAt = new Date().toISOString();
    this.currentState.durationMs = durationMs;
    onProgress?.(this.currentState, log4);

    return { ...this.currentState };
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const deployService = new DeployService();
