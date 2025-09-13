import React from 'react';
interface UserQuotaManagerProps {
    user: {
        id: string;
        email?: string;
        username?: string;
        credits: number;
        subscriptionStatus?: string;
        subscriptionPlan?: string;
    };
    onUpdate?: () => void;
}
export declare function UserQuotaManager({ user, onUpdate }: UserQuotaManagerProps): React.JSX.Element;
interface BulkQuotaManagerProps {
    selectedUsers: string[];
    onUpdate?: () => void;
}
export declare function BulkQuotaManager({ selectedUsers, onUpdate }: BulkQuotaManagerProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=UserQuotaManager.d.ts.map