import type { InputValidation } from './types';
export declare const INPUT_CONSTRAINTS: {
    readonly MIN_LENGTH: 3;
    readonly MAX_LENGTH: 500;
    readonly PLACEHOLDER: "Enter any topic you want to learn about...";
};
export declare const validateTopicInput: (input: string) => InputValidation;
export declare const sanitizeInput: (input: string) => string;
export declare const smoothScrollToSection: (sectionId: string) => void;
export declare const isSubmitShortcut: (event: KeyboardEvent) => boolean;
export declare const BREAKPOINTS: {
    readonly mobile: 768;
    readonly tablet: 1024;
    readonly desktop: 1200;
};
export declare const getBreakpoint: () => keyof typeof BREAKPOINTS;
export declare const ANIMATION_DURATIONS: {
    readonly fast: 200;
    readonly normal: 300;
    readonly slow: 500;
};
export declare const trapFocus: (element: HTMLElement) => void;
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => ((...args: Parameters<T>) => void);
export declare const classifyError: (error: any) => {
    type: "validation" | "network" | "server" | "unknown";
    message: string;
    retryable: boolean;
    details?: string;
};
export declare const createRetryHandler: (maxRetries?: number) => <T>(operation: () => Promise<T>, onRetry?: (attempt: number, error: any) => void) => Promise<T>;
export declare const getLoadingMessage: (stage: string, attempt?: number) => string;
//# sourceMappingURL=utils.d.ts.map