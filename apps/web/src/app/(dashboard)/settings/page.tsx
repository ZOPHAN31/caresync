'use client';

import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const { data: session } = useSession();
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span> {session?.user?.firstName}{' '}
            {session?.user?.lastName}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {session?.user?.email}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
