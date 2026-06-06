'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  useDashboard,
  useAppointments,
  useCreateAppointment,
  useCompleteAppointment,
} from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { Calendar, Clock, MapPin, Plus, X, CheckCircle2 } from 'lucide-react';

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const primaryTeam = session?.user?.careTeams?.[0];
  const { data: dashboard } = useDashboard(primaryTeam?.careTeamId);
  const recipientId = dashboard?.recipient?.id;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    provider: '',
    specialty: '',
    location: '',
    scheduledAt: '',
    notes: '',
    preparationInstructions: '',
    transportedBy: '',
  });

  const { data: appointments, isLoading } = useAppointments(recipientId, false);
  const createAppt = useCreateAppointment();
  const completeAppt = useCompleteAppointment();

  const upcoming =
    appointments?.filter(
      (a: { isCompleted: boolean; scheduledAt: string }) =>
        !a.isCompleted && new Date(a.scheduledAt) >= new Date()
    ) ?? [];
  const past =
    appointments?.filter(
      (a: { isCompleted: boolean; scheduledAt: string }) =>
        a.isCompleted || new Date(a.scheduledAt) < new Date()
    ) ?? [];

  const handleSubmit = async () => {
    if (!recipientId || !form.title || !form.scheduledAt) return;
    await createAppt.mutateAsync({ ...form, recipientId });
    setShowForm(false);
    setForm({
      title: '',
      provider: '',
      specialty: '',
      location: '',
      scheduledAt: '',
      notes: '',
      preparationInstructions: '',
      transportedBy: '',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        subtitle={
          dashboard?.recipient
            ? `${dashboard.recipient.firstName} ${dashboard.recipient.lastName}`
            : ''
        }
      />

      <Button onClick={() => setShowForm(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add appointment
      </Button>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">New appointment</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g. Neurology follow-up"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Date &amp; time *</Label>
                <Input
                  type="datetime-local"
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : '',
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Provider / doctor</Label>
                <Input
                  placeholder="Dr. Patricia Chen"
                  value={form.provider}
                  onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Input
                  placeholder="Neurology"
                  value={form.specialty}
                  onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="Memorial Medical Center"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Transported by</Label>
                <Input
                  placeholder="Narrissa"
                  value={form.transportedBy}
                  onChange={(e) => setForm((p) => ({ ...p, transportedBy: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preparation instructions</Label>
              <Textarea
                placeholder="What needs to happen before the appointment..."
                value={form.preparationInstructions}
                onChange={(e) =>
                  setForm((p) => ({ ...p, preparationInstructions: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={createAppt.isPending || !form.title || !form.scheduledAt}
                className="flex-1"
              >
                {createAppt.isPending ? 'Saving...' : 'Save appointment'}
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
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-muted-foreground mb-3 text-sm font-medium uppercase tracking-wide">
                Upcoming
              </h2>
              <div className="space-y-3">
                {upcoming.map(
                  (apt: {
                    id: string;
                    title: string;
                    provider?: string;
                    specialty?: string;
                    location?: string;
                    scheduledAt: string;
                    preparationInstructions?: string;
                    transportedBy?: string;
                  }) => (
                    <Card key={apt.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="font-medium">{apt.title}</p>
                              {apt.provider && (
                                <p className="text-muted-foreground text-sm">
                                  {apt.provider}
                                  {apt.specialty && ` · ${apt.specialty}`}
                                </p>
                              )}
                            </div>
                            <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(apt.scheduledAt).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {apt.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {apt.location}
                                </span>
                              )}
                              {apt.transportedBy && <span>Transport: {apt.transportedBy}</span>}
                            </div>
                            {apt.preparationInstructions && (
                              <p className="bg-muted rounded p-2 text-xs">
                                {apt.preparationInstructions}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-shrink-0 gap-1 text-xs"
                            onClick={() => completeAppt.mutate({ id: apt.id })}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Done
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-muted-foreground mb-3 text-sm font-medium uppercase tracking-wide">
                Past
              </h2>
              <div className="space-y-2">
                {past
                  .slice(0, 10)
                  .map(
                    (apt: {
                      id: string;
                      title: string;
                      provider?: string;
                      scheduledAt: string;
                      outcome?: string;
                    }) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-3 rounded border p-3 text-sm opacity-70"
                      >
                        <Calendar className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{apt.title}</span>
                          {apt.provider && (
                            <span className="text-muted-foreground"> · {apt.provider}</span>
                          )}
                          {apt.outcome && (
                            <p className="text-muted-foreground truncate text-xs">{apt.outcome}</p>
                          )}
                        </div>
                        <span className="text-muted-foreground flex-shrink-0 text-xs">
                          {new Date(apt.scheduledAt).toLocaleDateString()}
                        </span>
                      </div>
                    )
                  )}
              </div>
            </div>
          )}

          {!upcoming.length && !past.length && (
            <p className="text-muted-foreground text-sm">No appointments on file.</p>
          )}
        </div>
      )}
    </div>
  );
}
