/**
 * React hook for shared state management across tabs
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { sharedState } from '../sync/sharedStateManager';
export function useSharedState(key, initialValue, options) {
    const { userId, topicId, syncOnMount = true } = options || {};
    const [value, setValue] = useState(() => sharedState.getState(key) ?? initialValue);
    const unsubscribeRef = useRef(null);
    useEffect(() => {
        // Subscribe to state changes
        unsubscribeRef.current = sharedState.subscribe(key, (newValue) => {
            setValue(newValue);
        });
        // Sync from other tabs on mount
        if (syncOnMount) {
            sharedState.syncFromOtherTabs([key]);
        }
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [key, syncOnMount]);
    const updateValue = useCallback((newValue) => {
        sharedState.setState(key, newValue, { userId, topicId });
    }, [key, userId, topicId]);
    const clear = useCallback(() => {
        sharedState.clearState(key);
    }, [key]);
    const toggle = useCallback(() => {
        return sharedState.toggle(key, { userId, topicId });
    }, [key, userId, topicId]);
    const actions = {
        clear,
        ...(typeof value === 'boolean' ? { toggle } : {})
    };
    return [value, updateValue, actions];
}
export function useSharedArray(key, initialValue = [], options) {
    const { userId, topicId, maxLength, syncOnMount = true } = options || {};
    const [array, setArray] = useSharedState(key, initialValue, { userId, topicId, syncOnMount });
    const add = useCallback((item, unique = false) => {
        sharedState.addToArray(key, item, { userId, topicId, unique, maxLength });
    }, [key, userId, topicId, maxLength]);
    const remove = useCallback((predicate) => {
        sharedState.removeFromArray(key, predicate, { userId, topicId });
    }, [key, userId, topicId]);
    const clear = useCallback(() => {
        sharedState.clearState(key);
    }, [key]);
    const set = useCallback((items) => {
        sharedState.setState(key, items, { userId, topicId });
    }, [key, userId, topicId]);
    return [
        array || initialValue,
        { add, remove, clear, set }
    ];
}
export function useSharedObject(key, initialValue = {}, options) {
    const { userId, topicId, syncOnMount = true } = options || {};
    const [object, setObject] = useSharedState(key, initialValue, { userId, topicId, syncOnMount });
    const update = useCallback((updates) => {
        sharedState.updateObject(key, updates, { userId, topicId });
    }, [key, userId, topicId]);
    const set = useCallback((obj) => {
        sharedState.setState(key, obj, { userId, topicId });
    }, [key, userId, topicId]);
    const clear = useCallback(() => {
        sharedState.clearState(key);
    }, [key]);
    return [
        object || initialValue,
        { update, set, clear }
    ];
}
export function useGlobalAction() {
    const executeAction = useCallback((action, payload, userId) => {
        return sharedState['crossTabManager']?.executeGlobalAction?.(action, payload, userId) || Promise.resolve();
    }, []);
    const onAction = useCallback((callback) => {
        return sharedState['crossTabManager']?.on?.('global_action', (message) => {
            callback(message.data.action, message.data.payload);
        });
    }, []);
    return { executeAction, onAction };
}
export function useCrossTabSync() {
    const syncState = useCallback(async (keys) => {
        return sharedState.syncFromOtherTabs(keys);
    }, []);
    const clearAllState = useCallback((userId) => {
        sharedState.clearAllState(userId);
    }, []);
    const getTabsCount = useCallback(() => {
        return sharedState['crossTabManager']?.getActiveTabsCount?.() || 1;
    }, []);
    const isTabLeader = useCallback(() => {
        return sharedState['crossTabManager']?.isTabLeader?.() || true;
    }, []);
    return {
        syncState,
        clearAllState,
        getTabsCount,
        isTabLeader
    };
}
//# sourceMappingURL=useSharedState.js.map