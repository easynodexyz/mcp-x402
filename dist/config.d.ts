export interface X402Config {
    privateKey: `0x${string}`;
    apiUrl: string;
    maxPayment: number;
}
export interface ConfigValidationResult {
    valid: boolean;
    config?: X402Config;
    errors: string[];
}
/**
 * Load configuration from multiple sources in order:
 * 1. Environment variables (highest priority)
 * 2. .env file in current working directory
 * 3. ~/.easy-node/.env global config (lowest priority)
 */
export declare function loadConfig(): ConfigValidationResult;
export declare function getConfigPath(): string;
export declare function getConfigDir(): string;
//# sourceMappingURL=config.d.ts.map