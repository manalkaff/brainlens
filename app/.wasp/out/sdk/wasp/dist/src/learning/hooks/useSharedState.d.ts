/**
 * React hook for shared state management across tabs
 */
export declare function useSharedState<T>(key: string, initialValue?: T, options?: {
    userId?: string;
    topicId?: string;
    syncOnMount?: boolean;
}): [T | undefined, (value: T) => void, {
    clear: () => void;
    toggle?: () => boolean;
}];
export declare function useSharedArray<T>(key: string, initialValue?: T[], options?: {
    userId?: string;
    topicId?: string;
    maxLength?: number;
    syncOnMount?: boolean;
}): [
    T[],
    {
        add: (item: T, unique?: boolean) => void;
        remove: (predicate: (item: T) => boolean) => void;
        clear: () => void;
        set: (items: T[]) => void;
    }
];
export declare function useSharedObject<T extends Record<string, any>>(key: string, initialValue?: T, options?: {
    userId?: string;
    topicId?: string;
    syncOnMount?: boolean;
}): [
    T,
    {
        update: (updates: Partial<T>) => void;
        set: (obj: T) => void;
        clear: () => void;
    }
];
export declare function useGlobalAction(): {
    executeAction: (action: string, payload: any, userId?: string) => any;
    onAction: (callback: (action: string, payload: any) => void) => any;
};
export declare function useCrossTabSync(): {
    syncState: (keys?: string[]) => Promise<void>;
    clearAllState: (userId?: string) => void;
    getTabsCount: () => any;
    isTabLeader: () => any;
};
//# sourceMappingURL=useSharedState.d.ts.map