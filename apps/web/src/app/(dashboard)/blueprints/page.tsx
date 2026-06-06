'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboard, useBlueprints } from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';

const TRIGGER_LABELS: Record<string, string> = {
  FALL: 'If there is a fall',
  HOSPITALIZATION: 'If hospitalized',
  HOSPICE_TRANSITION: 'If transitioning to hospice',
  CAREGIVER_BURNOUT: 'If primary caregiver burns out',
  PRIMARY_CAREGIVER_UNAVAILABLE: 'If primary caregiver is unavailable',
  BEHAVIORAL_CRISIS: 'If there is a behavioral crisis',
  CUSTOM: 'Custom scenario',
};

export default function BlueprintsPage() {
  const { data: session } = useSession();
  const primaryTeam = session?.user?.careTeams?.[0];
  const { data: dashboard } = useDashboard(primaryTeam?.careTeamId);
  const recipientId = dashboard?.recipient?.id;

  const { data: blueprints, isLoading } = useBlueprints(recipientId);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Future care blueprints"
        subtitle="Plans prepared in advance for difficult scenarios"
      />

      <div className="bg-muted text-muted-foreground rounded-lg p-4 text-sm">
        <Shield className="mr-2 inline h-4 w-4" />
        These blueprints ensure everyone knows exactly what to do when a crisis happens — before it
        happens. No scrambling. No confusion.
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !blueprints?.length ? (
        <p className="text-muted-foreground text-sm">No blueprints created yet.</p>
      ) : (
        <div className="space-y-3">
          {blueprints.map(
            (bp: {
              id: string;
              title: string;
              trigger: string;
              description?: string;
              isActive: boolean;
              lastReviewed?: string;
              steps: { order: number; action: string; responsible: string; notes?: string }[];
              contacts: { name: string; phone: string; role: string }[];
            }) => (
              <Card key={bp.id}>
                <CardHeader
                  className="cursor-pointer pb-2"
                  onClick={() => setExpanded(expanded === bp.id ? null : bp.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{bp.title}</CardTitle>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {TRIGGER_LABELS[bp.trigger] ?? bp.trigger}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <Badge variant={bp.isActive ? 'default' : 'secondary'}>
                        {bp.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {expanded === bp.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expanded === bp.id && (
                  <CardContent className="space-y-4 pt-0">
                    {bp.description && <p className="text-sm">{bp.description}</p>}

                    <div>
                      <p className="mb-2 text-sm font-medium">Steps</p>
                      <div className="space-y-2">
                        {bp.steps.map(
                          (step: {
                            order: number;
                            action: string;
                            responsible: string;
                            notes?: string;
                          }) => (
                            <div key={step.order} className="flex gap-3 text-sm">
                              <span className="bg-primary/10 text-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                {step.order}
                              </span>
                              <div>
                                <p>{step.action}</p>
                                <p className="text-muted-foreground text-xs">
                                  Responsible: {step.responsible}
                                </p>
                                {step.notes && (
                                  <p className="text-muted-foreground text-xs italic">
                                    {step.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {bp.contacts?.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium">Key contacts</p>
                        <div className="space-y-1">
                          {bp.contacts.map(
                            (c: { name: string; phone: string; role: string }, i: number) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span>
                                  {c.name} <span className="text-muted-foreground">({c.role})</span>
                                </span>
                                <a href={`tel:${c.phone}`} className="text-primary hover:underline">
                                  {c.phone}
                                </a>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {bp.lastReviewed && (
                      <p className="text-muted-foreground text-xs">
                        Last reviewed: {new Date(bp.lastReviewed).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
