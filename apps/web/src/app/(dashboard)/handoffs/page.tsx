'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboard, useHandoffs, useCreateHandoff } from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { Plus, X, ArrowRight } from 'lucide-react';

const EMPTY_FORM = {
  summary: '',
  shiftType: 'morning',
  mealsGiven: '',
  waterIntake: '',
  medicationsGiven: '',
  medicationsMissed: '',
  mood: '',
  painLevel: '',
  behavioralNotes: '',
  pendingTasks: '',
  urgentItems: '',
  generalNotes: '',
};

export default function HandoffsPage() {
  const { data: session } = useSession();
  const primaryTeam = session?.user?.careTeams?.[0];
  const { data: dashboard } = useDashboard(primaryTeam?.careTeamId);
  const recipientId = dashboard?.recipient?.id;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: handoffs, isLoading } = useHandoffs(recipientId);
  const createHandoff = useCreateHandoff();

  const handleSubmit = async () => {
    if (!recipientId || !form.summary) return;
    await createHandoff.mutateAsync({
      recipientId,
      ...form,
      painLevel: form.painLevel ? parseInt(form.painLevel) : undefined,
    });
    setShowForm(false);
    setForm({ ...EMPTY_FORM });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Shift handoffs" subtitle="End-of-shift reports for continuity of care" />

      <Button onClick={() => setShowForm(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        New handoff report
      </Button>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">End-of-shift report</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Shift type</Label>
                <Select
                  value={form.shiftType}
                  onValueChange={(v) => setForm((p) => ({ ...p, shiftType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['morning', 'afternoon', 'night', '24hr'].map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pain level (0–10)</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="0 = no pain"
                  value={form.painLevel}
                  onChange={(e) => setForm((p) => ({ ...p, painLevel: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Meals given</Label>
                <Input
                  placeholder="Breakfast: full, Lunch: half"
                  value={form.mealsGiven}
                  onChange={(e) => setForm((p) => ({ ...p, mealsGiven: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Water intake</Label>
                <Input
                  placeholder="24oz"
                  value={form.waterIntake}
                  onChange={(e) => setForm((p) => ({ ...p, waterIntake: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Medications given</Label>
                <Input
                  placeholder="Donepezil ✓, Carbidopa 7:30am ✓"
                  value={form.medicationsGiven}
                  onChange={(e) => setForm((p) => ({ ...p, medicationsGiven: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mood</Label>
                <Input
                  placeholder="Good in morning, agitated 3pm"
                  value={form.mood}
                  onChange={(e) => setForm((p) => ({ ...p, mood: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Summary * (required)</Label>
              <Textarea
                placeholder="Brief overview of the shift..."
                value={form.summary}
                onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Pending tasks for next caregiver</Label>
              <Textarea
                placeholder="What still needs to be done..."
                value={form.pendingTasks}
                onChange={(e) => setForm((p) => ({ ...p, pendingTasks: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Urgent items</Label>
              <Textarea
                placeholder="Anything the next caregiver absolutely needs to know..."
                value={form.urgentItems}
                onChange={(e) => setForm((p) => ({ ...p, urgentItems: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={createHandoff.isPending || !form.summary}
                className="flex-1"
              >
                {createHandoff.isPending ? 'Submitting...' : 'Submit handoff'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !handoffs?.length ? (
        <p className="text-muted-foreground text-sm">No handoff reports yet.</p>
      ) : (
        <div className="space-y-3">
          {handoffs.map(
            (h: {
              id: string;
              shiftType?: string;
              shiftDate: string;
              summary: string;
              giver: { firstName: string; lastName: string };
              receiver?: { firstName: string; lastName: string };
              isRead: boolean;
              urgentItems?: string;
              pendingTasks?: string;
              painLevel?: number;
              mood?: string;
            }) => (
              <Card key={h.id} className={!h.isRead ? 'border-primary/40' : ''}>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {h.giver.firstName} {h.giver.lastName}
                      </span>
                      {h.receiver && (
                        <>
                          <ArrowRight className="text-muted-foreground h-3 w-3" />
                          <span>
                            {h.receiver.firstName} {h.receiver.lastName}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {!h.isRead && <Badge className="text-xs">Unread</Badge>}
                      {h.shiftType && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {h.shiftType}
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-xs">
                        {new Date(h.shiftDate).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm">{h.summary}</p>
                  {h.urgentItems && (
                    <div className="bg-destructive/10 text-destructive rounded p-2 text-xs">
                      <strong>Urgent:</strong> {h.urgentItems}
                    </div>
                  )}
                  {h.pendingTasks && (
                    <p className="text-muted-foreground text-xs">
                      <strong>Pending:</strong> {h.pendingTasks}
                    </p>
                  )}
                  {h.painLevel !== undefined && h.painLevel !== null && (
                    <p className="text-muted-foreground text-xs">Pain level: {h.painLevel}/10</p>
                  )}
                  {h.mood && <p className="text-muted-foreground text-xs">Mood: {h.mood}</p>}
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
