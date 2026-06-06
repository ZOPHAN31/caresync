'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCareLogs, useCreateCareLog, useDashboard } from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, X } from 'lucide-react';

const LOG_TYPES = [
  'MEAL',
  'WATER',
  'MEDICATION',
  'BATHROOM',
  'SLEEP',
  'MOOD',
  'PAIN',
  'FALL',
  'BEHAVIORAL',
  'GENERAL',
];

export default function CareLogPage() {
  const { data: session } = useSession();
  const primaryTeam = session?.user?.careTeams?.[0];
  const { data: dashboard } = useDashboard(primaryTeam?.careTeamId);
  const recipientId = dashboard?.recipient?.id;

  const [showForm, setShowForm] = useState(false);
  const [logType, setLogType] = useState('MEAL');
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({});
  const [notes, setNotes] = useState('');

  const { data: logs, isLoading } = useCareLogs(recipientId, { limit: 30 });
  const createLog = useCreateCareLog();

  const handleSubmit = async () => {
    if (!recipientId) return;
    await createLog.mutateAsync({ recipientId, type: logType, notes, ...formData });
    setShowForm(false);
    setFormData({});
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Care log"
        subtitle={
          dashboard?.recipient
            ? `${dashboard.recipient.firstName} ${dashboard.recipient.lastName}`
            : ''
        }
      />

      <Button onClick={() => setShowForm(true)} className="gap-2">
        <Plus className="h-4 w-4" /> Add entry
      </Button>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">New log entry</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Entry type</Label>
              <Select value={logType} onValueChange={setLogType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOG_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0) + t.slice(1).toLowerCase().replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {logType === 'MEAL' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>What was eaten</Label>
                  <Input
                    placeholder="e.g. Oatmeal with banana"
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, mealDescription: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount eaten</Label>
                  <Select onValueChange={(v) => setFormData((p) => ({ ...p, mealAmount: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {['full', 'half', 'quarter', 'refused', 'supplement'].map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {logType === 'WATER' && (
              <div className="space-y-2">
                <Label>Amount (oz)</Label>
                <Input
                  type="number"
                  placeholder="8"
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, waterOz: parseFloat(e.target.value) }))
                  }
                />
              </div>
            )}

            {logType === 'MOOD' && (
              <div className="space-y-2">
                <Label>Mood rating (1–5)</Label>
                <Select
                  onValueChange={(v) => setFormData((p) => ({ ...p, moodRating: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} — {['Very low', 'Low', 'Neutral', 'Good', 'Great'][n - 1]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {logType === 'PAIN' && (
              <div className="space-y-2">
                <Label>Pain level (0–10)</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="0 = no pain"
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, painLevel: parseInt(e.target.value) }))
                  }
                />
              </div>
            )}

            {logType === 'FALL' && (
              <div className="space-y-2">
                <Label>Where did the fall occur?</Label>
                <Input
                  placeholder="e.g. Bathroom, bedroom"
                  onChange={(e) => setFormData((p) => ({ ...p, fallLocation: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any additional observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={createLog.isPending} className="flex-1">
                {createLog.isPending ? 'Saving...' : 'Save entry'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !logs?.length ? (
            <p className="text-muted-foreground text-sm">
              No log entries yet. Add the first one above.
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map(
                (log: {
                  id: string;
                  type: string;
                  occurredAt: string;
                  loggedByUser: { firstName: string; lastName: string };
                  notes?: string;
                  mealDescription?: string;
                  mealAmount?: string;
                  waterOz?: number;
                  moodRating?: number;
                  painLevel?: number;
                  fallLocation?: string;
                  behaviorDescription?: string;
                }) => (
                  <div key={log.id} className="flex items-start gap-3 rounded border p-3">
                    <Badge variant="outline" className="flex-shrink-0 text-xs">
                      {log.type.charAt(0) + log.type.slice(1).toLowerCase().replace('_', ' ')}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {log.mealDescription && (
                          <span>
                            {log.mealDescription} {log.mealAmount && `(${log.mealAmount})`}
                          </span>
                        )}
                        {log.waterOz && <span>{log.waterOz} oz water</span>}
                        {log.moodRating && <span>Mood: {log.moodRating}/5</span>}
                        {log.painLevel !== undefined && <span>Pain: {log.painLevel}/10</span>}
                        {log.fallLocation && <span>Fall in {log.fallLocation}</span>}
                        {log.behaviorDescription && <span>{log.behaviorDescription}</span>}
                        {!log.mealDescription &&
                          !log.waterOz &&
                          !log.moodRating &&
                          log.painLevel === undefined &&
                          !log.fallLocation &&
                          !log.behaviorDescription &&
                          (log.notes || '—')}
                      </p>
                      {log.notes && log.mealDescription && (
                        <p className="text-muted-foreground mt-1 text-xs">{log.notes}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-muted-foreground text-xs">
                        {new Date(log.occurredAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-muted-foreground text-xs">{log.loggedByUser.firstName}</p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
