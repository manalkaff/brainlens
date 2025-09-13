/**
 * Used purely to help compiler check for exhaustiveness in switch statements,
 * will never execute. See https://stackoverflow.com/a/39419171.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertUnreachable(x) {
    throw Error('This code should be unreachable');
}
/**
 * Generate a v4 UUID
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
/**
 * Allows for throttling a function call while still allowing the last invocation to be executed after the throttle delay ends.
 */
export function throttleWithTrailingInvocation(fn, delayInMilliseconds) {
    let fnLastCallTime = null;
    let trailingInvocationTimeoutId = null;
    let isTrailingInvocationPending = false;
    const callFn = () => {
        fnLastCallTime = Date.now();
        fn();
    };
    const throttledFn = () => {
        const currentTime = Date.now();
        const timeSinceLastExecution = fnLastCallTime ? currentTime - fnLastCallTime : 0;
        const shouldCallImmediately = fnLastCallTime === null || timeSinceLastExecution >= delayInMilliseconds;
        if (shouldCallImmediately) {
            callFn();
            return;
        }
        if (!isTrailingInvocationPending) {
            isTrailingInvocationPending = true;
            const remainingDelayTime = Math.max(delayInMilliseconds - timeSinceLastExecution, 0);
            trailingInvocationTimeoutId = setTimeout(() => {
                callFn();
                isTrailingInvocationPending = false;
            }, remainingDelayTime);
        }
    };
    throttledFn.cancel = () => {
        if (trailingInvocationTimeoutId) {
            clearTimeout(trailingInvocationTimeoutId);
            trailingInvocationTimeoutId = null;
        }
        isTrailingInvocationPending = false;
    };
    return throttledFn;
}
//# sourceMappingURL=utils.js.map