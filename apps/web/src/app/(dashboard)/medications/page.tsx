'use client';

import { useSession } from 'next-auth/react';
import { useMedications, useLogMedication, useDashboard } from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { CheckCircle2, Clock, Pill } from 'lucide-react';

export default function MedicationsPage() {
  const { data: session } = useSession();
  const primaryTeam = session?.user?.careTeams?.[0];
  const { data: dashboard } = useDashboard(primaryTeam?.careTeamId);
  const recipientId = dashboard?.recipient?.id;

  const { data: medications, isLoading } = useMedications(recipientId);
  const logMed = useLogMedication();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medications"
        subtitle={
          dashboard?.recipient
            ? `${dashboard.recipient.firstName} ${dashboard.recipient.lastName}`
            : ''
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !medications?.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Pill className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
            <p className="text-muted-foreground text-sm">No medications on file.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {medications.map(
            (med: {
              id: string;
              name: string;
              genericName?: string;
              dosage: string;
              unit: string;
              frequency: string;
              purpose?: string;
              instructions?: string;
              isPRN: boolean;
              prescribedBy?: string;
              refillDate?: string;
              pillsRemaining?: number;
              sideEffects: string[];
              scheduleTimes: { scheduledTime: string; label?: string }[];
            }) => (
              <Card key={med.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{med.name}</CardTitle>
                      {med.genericName && (
                        <p className="text-muted-foreground text-sm">{med.genericName}</p>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 gap-2">
                      {med.isPRN && <Badge variant="outline">PRN</Badge>}
                      <Badge variant="secondary">
                        {med.dosage}
                        {med.unit}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {med.purpose && <p className="text-muted-foreground text-sm">{med.purpose}</p>}

                  {med.scheduleTimes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {med.scheduleTimes.map((t: { scheduledTime: string; label?: string }) => (
                        <div
                          key={t.scheduledTime}
                          className="bg-secondary flex items-center gap-1 rounded px-2 py-1 text-xs"
                        >
                          <Clock className="h-3 w-3" />
                          {t.label || t.scheduledTime}
                        </div>
                      ))}
                    </div>
                  )}

                  {med.instructions && (
                    <div className="bg-muted text-muted-foreground rounded p-2 text-xs">
                      {med.instructions}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground flex gap-2 text-xs">
                      {med.prescribedBy && <span>Dr. {med.prescribedBy}</span>}
                      {med.pillsRemaining !== undefined && med.pillsRemaining !== null && (
                        <span
                          className={med.pillsRemaining <= 7 ? 'font-medium text-orange-500' : ''}
                        >
                          {med.pillsRemaining} pills remaining
                        </span>
                      )}
                    </div>
                    {!med.isPRN && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        onClick={() => logMed.mutate({ medicationId: med.id, given: true })}
                        disabled={logMed.isPending}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Mark given
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
