/**
 * React hook for shared state management across tabs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { sharedState } from '../sync/sharedStateManager';

export function useSharedState<T>(
  key: string,
  initialValue?: T,
  options?: {
    userId?: string;
    topicId?: string;
    syncOnMount?: boolean;
  }
): [T | undefined, (value: T) => void, { clear: () => void; toggle?: () => boolean }] {
  const { userId, topicId, syncOnMount = true } = options || {};
  const [value, setValue] = useState<T | undefined>(() => 
    sharedState.getState<T>(key) ?? initialValue
  );
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Subscribe to state changes
    unsubscribeRef.current = sharedState.subscribe<T>(key, (newValue) => {
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

  const updateValue = useCallback((newValue: T) => {
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

export function useSharedArray<T>(
  key: string,
  initialValue: T[] = [],
  options?: {
    userId?: string;
    topicId?: string;
    maxLength?: number;
    syncOnMount?: boolean;
  }
): [
  T[],
  {
    add: (item: T, unique?: boolean) => void;
    remove: (predicate: (item: T) => boolean) => void;
    clear: () => void;
    set: (items: T[]) => void;
  }
] {
  const { userId, topicId, maxLength, syncOnMount = true } = options || {};
  const [array, setArray] = useSharedState<T[]>(key, initialValue, { userId, topicId, syncOnMount });

  const add = useCallback((item: T, unique = false) => {
    sharedState.addToArray(key, item, { userId, topicId, unique, maxLength });
  }, [key, userId, topicId, maxLength]);

  const remove = useCallback((predicate: (item: T) => boolean) => {
    sharedState.removeFromArray(key, predicate, { userId, topicId });
  }, [key, userId, topicId]);

  const clear = useCallback(() => {
    sharedState.clearState(key);
  }, [key]);

  const set = useCallback((items: T[]) => {
    sharedState.setState(key, items, { userId, topicId });
  }, [key, userId, topicId]);

  return [
    array || initialValue,
    { add, remove, clear, set }
  ];
}

export function useSharedObject<T extends Record<string, any>>(
  key: string,
  initialValue: T = {} as T,
  options?: {
    userId?: string;
    topicId?: string;
    syncOnMount?: boolean;
  }
): [
  T,
  {
    update: (updates: Partial<T>) => void;
    set: (obj: T) => void;
    clear: () => void;
  }
] {
  const { userId, topicId, syncOnMount = true } = options || {};
  const [object, setObject] = useSharedState<T>(key, initialValue, { userId, topicId, syncOnMount });

  const update = useCallback((updates: Partial<T>) => {
    sharedState.updateObject(key, updates, { userId, topicId });
  }, [key, userId, topicId]);

  const set = useCallback((obj: T) => {
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
  const executeAction = useCallback((action: string, payload: any, userId?: string) => {
    return (sharedState as any)['crossTabManager']?.executeGlobalAction?.(action, payload, userId) || Promise.resolve();
  }, []);

  const onAction = useCallback((callback: (action: string, payload: any) => void) => {
    return (sharedState as any)['crossTabManager']?.on?.('global_action', (message: any) => {
      callback(message.data.action, message.data.payload);
    });
  }, []);

  return { executeAction, onAction };
}

export function useCrossTabSync() {
  const syncState = useCallback(async (keys?: string[]) => {
    return sharedState.syncFromOtherTabs(keys);
  }, []);

  const clearAllState = useCallback((userId?: string) => {
    sharedState.clearAllState(userId);
  }, []);

  const getTabsCount = useCallback(() => {
    return (sharedState as any)['crossTabManager']?.getActiveTabsCount?.() || 1;
  }, []);

  const isTabLeader = useCallback(() => {
    return (sharedState as any)['crossTabManager']?.isTabLeader?.() || true;
  }, []);

  return {
    syncState,
    clearAllState,
    getTabsCount,
    isTabLeader
  };
}