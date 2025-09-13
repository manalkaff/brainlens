import React from 'react';
import type { Topic } from 'wasp/entities';
interface BatchExportDialogProps {
    topics: Topic[];
    topicContentMap: Map<Topic, string>;
    onClose: () => void;
}
export declare function BatchExportDialog({ topics, topicContentMap, onClose }: BatchExportDialogProps): React.JSX.Element;
export {};
//# sourceMappingURL=BatchExportDialog.d.ts.map