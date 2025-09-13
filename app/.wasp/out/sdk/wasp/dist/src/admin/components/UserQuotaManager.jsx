import React, { useState } from 'react';
import { updateUserLearningQuota } from 'wasp/client/operations';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Settings, CreditCard, User, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
export function UserQuotaManager({ user, onUpdate }) {
    const [isOpen, setIsOpen] = useState(false);
    const [credits, setCredits] = useState(user.credits.toString());
    const [customLimits, setCustomLimits] = useState({
        topicsPerMonth: '',
        chatMessagesPerDay: '',
        quizzesPerWeek: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateResult, setUpdateResult] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        setUpdateResult(null);
        try {
            const updateData = {
                userId: user.id
            };
            // Update credits if changed
            const newCredits = parseInt(credits);
            if (!isNaN(newCredits) && newCredits !== user.credits) {
                updateData.credits = newCredits;
            }
            // Update custom limits if provided
            const limits = {};
            if (customLimits.topicsPerMonth) {
                const value = parseInt(customLimits.topicsPerMonth);
                if (!isNaN(value))
                    limits.topicsPerMonth = value;
            }
            if (customLimits.chatMessagesPerDay) {
                const value = parseInt(customLimits.chatMessagesPerDay);
                if (!isNaN(value))
                    limits.chatMessagesPerDay = value;
            }
            if (customLimits.quizzesPerWeek) {
                const value = parseInt(customLimits.quizzesPerWeek);
                if (!isNaN(value))
                    limits.quizzesPerWeek = value;
            }
            if (Object.keys(limits).length > 0) {
                updateData.customLimits = limits;
            }
            await updateUserLearningQuota(updateData);
            setUpdateResult({
                type: 'success',
                message: 'User quota updated successfully'
            });
            if (onUpdate) {
                onUpdate();
            }
            // Close dialog after successful update
            setTimeout(() => {
                setIsOpen(false);
                setUpdateResult(null);
            }, 2000);
        }
        catch (error) {
            console.error('Failed to update user quota:', error);
            setUpdateResult({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to update user quota'
            });
        }
        finally {
            setIsUpdating(false);
        }
    };
    const resetForm = () => {
        setCredits(user.credits.toString());
        setCustomLimits({
            topicsPerMonth: '',
            chatMessagesPerDay: '',
            quizzesPerWeek: ''
        });
        setUpdateResult(null);
    };
    return (<Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
                resetForm();
            }
        }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2"/>
          Manage Quota
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5"/>
            Manage User Quota
          </DialogTitle>
          <DialogDescription>
            Update credits and learning limits for {user.email || user.username || `User ${user.id.slice(0, 8)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.email || user.username || 'Unknown User'}</p>
                  <p className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                    {user.subscriptionPlan || 'Free'}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">{user.credits} credits</p>
                    <p className="text-xs text-muted-foreground">Current balance</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Credits */}
            <div className="space-y-2">
              <Label htmlFor="credits" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4"/>
                Credits
              </Label>
              <Input id="credits" type="number" min="0" value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="Enter new credit amount"/>
              <p className="text-xs text-muted-foreground">
                Current: {user.credits} credits
              </p>
            </div>

            {/* Custom Limits */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Custom Limits (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Leave empty to use default plan limits
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="topicsPerMonth" className="text-xs">Topics per Month</Label>
                  <Input id="topicsPerMonth" type="number" min="0" value={customLimits.topicsPerMonth} onChange={(e) => setCustomLimits(prev => ({ ...prev, topicsPerMonth: e.target.value }))} placeholder="e.g., 50"/>
                </div>
                
                <div>
                  <Label htmlFor="chatMessagesPerDay" className="text-xs">Chat Messages per Day</Label>
                  <Input id="chatMessagesPerDay" type="number" min="0" value={customLimits.chatMessagesPerDay} onChange={(e) => setCustomLimits(prev => ({ ...prev, chatMessagesPerDay: e.target.value }))} placeholder="e.g., 200"/>
                </div>
                
                <div>
                  <Label htmlFor="quizzesPerWeek" className="text-xs">Quizzes per Week</Label>
                  <Input id="quizzesPerWeek" type="number" min="0" value={customLimits.quizzesPerWeek} onChange={(e) => setCustomLimits(prev => ({ ...prev, quizzesPerWeek: e.target.value }))} placeholder="e.g., 20"/>
                </div>
              </div>
            </div>

            {/* Update Result */}
            {updateResult && (<Alert variant={updateResult.type === 'error' ? 'destructive' : 'default'}>
                {updateResult.type === 'success' ? (<CheckCircle className="h-4 w-4"/>) : (<AlertTriangle className="h-4 w-4"/>)}
                <AlertDescription>{updateResult.message}</AlertDescription>
              </Alert>)}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (<>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                    Updating...
                  </>) : ('Update Quota')}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>);
}
export function BulkQuotaManager({ selectedUsers, onUpdate }) {
    const [isOpen, setIsOpen] = useState(false);
    const [credits, setCredits] = useState('');
    const [operation, setOperation] = useState('add');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateResult, setUpdateResult] = useState(null);
    const handleBulkUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        setUpdateResult(null);
        try {
            const creditAmount = parseInt(credits);
            if (isNaN(creditAmount)) {
                throw new Error('Please enter a valid credit amount');
            }
            const promises = selectedUsers.map(userId => updateUserLearningQuota({
                userId,
                credits: operation === 'add' ? undefined : creditAmount, // For 'add', we'd need to fetch current credits first
            }));
            await Promise.all(promises);
            setUpdateResult({
                type: 'success',
                message: `Successfully updated quota for ${selectedUsers.length} users`
            });
            if (onUpdate) {
                onUpdate();
            }
            setTimeout(() => {
                setIsOpen(false);
                setUpdateResult(null);
            }, 2000);
        }
        catch (error) {
            console.error('Failed to bulk update quotas:', error);
            setUpdateResult({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to update quotas'
            });
        }
        finally {
            setIsUpdating(false);
        }
    };
    if (selectedUsers.length === 0) {
        return null;
    }
    return (<Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2"/>
          Bulk Update ({selectedUsers.length})
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Update User Quotas</DialogTitle>
          <DialogDescription>
            Update credits for {selectedUsers.length} selected users
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleBulkUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label>Operation</Label>
            <div className="flex gap-2">
              <Button type="button" variant={operation === 'set' ? 'default' : 'outline'} size="sm" onClick={() => setOperation('set')}>
                Set Credits
              </Button>
              <Button type="button" variant={operation === 'add' ? 'default' : 'outline'} size="sm" onClick={() => setOperation('add')} disabled // TODO: Implement add operation
    >
                Add Credits
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulkCredits">Credit Amount</Label>
            <Input id="bulkCredits" type="number" min="0" value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="Enter credit amount" required/>
          </div>

          {updateResult && (<Alert variant={updateResult.type === 'error' ? 'destructive' : 'default'}>
              {updateResult.type === 'success' ? (<CheckCircle className="h-4 w-4"/>) : (<AlertTriangle className="h-4 w-4"/>)}
              <AlertDescription>{updateResult.message}</AlertDescription>
            </Alert>)}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (<>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                  Updating...
                </>) : (`Update ${selectedUsers.length} Users`)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
}
//# sourceMappingURL=UserQuotaManager.jsx.map