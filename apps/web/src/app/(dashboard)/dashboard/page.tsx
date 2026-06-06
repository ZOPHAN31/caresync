'use client';

import { Activity, ListChecks, Pill, Users } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const stats = [
  { label: "Today's Tasks", value: 0, icon: ListChecks, hint: 'No tasks scheduled yet' },
  { label: 'Medications Due', value: 0, icon: Pill, hint: 'Nothing due right now' },
  { label: 'Family Members Active', value: 0, icon: Users, hint: 'Invite your family to begin' },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="A snapshot of today's care across your family." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, hint }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
              <Icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
              <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent Logs</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Loading skeletons stand in until the API is wired up. */}
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
