'use client';

import { useSession } from 'next-auth/react';
import { useDashboard, useMyTasks } from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { CheckCircle2, Clock, AlertTriangle, Heart, Package, Pill, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

function getTimeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

function formatRole(role: string) {
  return role
    .split('_')
    .map((w: string) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function formatDateTime(date: string) {
  try {
    return format(parseISO(date), 'MMM d, yyyy h:mm a');
  } catch {
    return date;
  }
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const primaryTeam = session?.user?.careTeams?.[0];
  const { data: dashboard, isLoading } = useDashboard(primaryTeam?.careTeamId);
  const { data: myTasks, completeTask } = useMyTasks();

  if (!session) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${getTimeOfDay()}, ${session.user.firstName}`}
        subtitle={
          primaryTeam
            ? `${primaryTeam.careTeamName} · ${formatRole(primaryTeam.role)}`
            : 'Welcome to CareSync'
        }
      />

      {/* Alert strip */}
      {dashboard &&
        (dashboard.alerts.unreadHandoffs > 0 ||
          dashboard.alerts.lowInventoryCount > 0 ||
          dashboard.alerts.missedMedications > 0) && (
          <div className="flex flex-wrap gap-2">
            {dashboard.alerts.unreadHandoffs > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {dashboard.alerts.unreadHandoffs} unread handoff
                {dashboard.alerts.unreadHandoffs > 1 ? 's' : ''}
              </Badge>
            )}
            {dashboard.alerts.missedMedications > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Pill className="h-3 w-3" />
                {dashboard.alerts.missedMedications} medication
                {dashboard.alerts.missedMedications > 1 ? 's' : ''} not yet given
              </Badge>
            )}
            {dashboard.alerts.lowInventoryCount > 0 && (
              <Badge variant="outline" className="gap-1 border-orange-400 text-orange-600">
                <Package className="h-3 w-3" />
                {dashboard.alerts.lowInventoryCount} supply item
                {dashboard.alerts.lowInventoryCount > 1 ? 's' : ''} low
              </Badge>
            )}
          </div>
        )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <Pill className="h-4 w-4" />
              Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboard?.medications.allGiven ?? 0}/{dashboard?.medications.total ?? 0}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">given today</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{dashboard?.tasks.pending ?? 0}</div>
                <p className="text-muted-foreground mt-1 text-xs">pending</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <Heart className="h-4 w-4" />
              Care logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{dashboard?.todaysLogs?.length ?? 0}</div>
                <p className="text-muted-foreground mt-1 text-xs">entries today</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboard?.upcomingAppointments?.length ?? 0}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">this week</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" />
              My tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !myTasks?.length ? (
              <p className="text-muted-foreground text-sm">No tasks assigned to you right now.</p>
            ) : (
              <div className="space-y-3">
                {myTasks
                  .slice(0, 5)
                  .map(
                    (assignment: {
                      id: string;
                      task: { title: string; priority: number; category?: string };
                    }) => (
                      <div
                        key={assignment.id}
                        className="bg-background flex items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{assignment.task.title}</p>
                          {assignment.task.category && (
                            <p className="text-muted-foreground text-xs">
                              {assignment.task.category}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() =>
                              completeTask.mutate({
                                assignmentId: assignment.id,
                                status: 'SKIPPED',
                              })
                            }
                          >
                            Skip
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() =>
                              completeTask.mutate({
                                assignmentId: assignment.id,
                                status: 'COMPLETED',
                              })
                            }
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    )
                  )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's care log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-4 w-4" />
              Today&apos;s care log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !dashboard?.todaysLogs?.length ? (
              <p className="text-muted-foreground text-sm">No entries logged today yet.</p>
            ) : (
              <div className="space-y-2">
                {dashboard.todaysLogs.map(
                  (log: {
                    id: string;
                    type: string;
                    occurredAt: string;
                    loggedByUser: { firstName: string; lastName: string };
                    notes?: string;
                    mealDescription?: string;
                    moodRating?: number;
                    painLevel?: number;
                  }) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 border-b py-2 text-sm last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium capitalize">
                          {log.type.toLowerCase().replace('_', ' ')}
                        </span>
                        {log.mealDescription && (
                          <span className="text-muted-foreground"> — {log.mealDescription}</span>
                        )}
                        {log.moodRating && (
                          <span className="text-muted-foreground"> — {log.moodRating}/5</span>
                        )}
                        {log.painLevel !== undefined && log.painLevel !== null && (
                          <span className="text-muted-foreground"> — Pain {log.painLevel}/10</span>
                        )}
                        {log.notes && (
                          <p className="text-muted-foreground truncate text-xs">{log.notes}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-muted-foreground text-xs">
                          {new Date(log.occurredAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {log.loggedByUser.firstName}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medications today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill className="h-4 w-4" />
              Medications today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !dashboard?.medications?.items?.length ? (
              <p className="text-muted-foreground text-sm">No scheduled medications.</p>
            ) : (
              <div className="space-y-2">
                {dashboard.medications.items.map(
                  (med: {
                    id: string;
                    name: string;
                    dosage: string;
                    unit: string;
                    allGiven: boolean;
                    givenToday: number;
                    totalDoses: number;
                    scheduleTimes: { scheduledTime: string; label?: string }[];
                  }) => (
                    <div key={med.id} className="flex items-center gap-3 rounded border p-2">
                      <div
                        className={`h-2 w-2 flex-shrink-0 rounded-full ${med.allGiven ? 'bg-green-500' : 'bg-orange-400'}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{med.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {med.dosage}
                          {med.unit} ·{' '}
                          {med.scheduleTimes.map((t) => t.label || t.scheduledTime).join(', ')}
                        </p>
                      </div>
                      <Badge
                        variant={med.allGiven ? 'secondary' : 'outline'}
                        className="flex-shrink-0 text-xs"
                      >
                        {med.givenToday}/{med.totalDoses}
                      </Badge>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Upcoming appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !dashboard?.upcomingAppointments?.length ? (
              <p className="text-muted-foreground text-sm">No appointments in the next 7 days.</p>
            ) : (
              <div className="space-y-3">
                {dashboard.upcomingAppointments.map(
                  (apt: {
                    id: string;
                    title: string;
                    provider?: string;
                    scheduledAt: string;
                    location?: string;
                  }) => (
                    <div key={apt.id} className="space-y-1 rounded border p-3">
                      <p className="text-sm font-medium">{apt.title}</p>
                      {apt.provider && (
                        <p className="text-muted-foreground text-xs">{apt.provider}</p>
                      )}
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(apt.scheduledAt)}
                        {apt.location && <span>· {apt.location}</span>}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
