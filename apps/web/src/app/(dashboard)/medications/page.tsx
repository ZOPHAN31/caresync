'use client';

import { Pill, Plus } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export default function MedicationsPage() {
  return (
    <div>
      <PageHeader
        title="Medications"
        subtitle="Manage prescriptions, schedules, and dosage history."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add medication
          </Button>
        }
      />
      <EmptyState
        icon={Pill}
        title="No medications added"
        description="Add a medication to set up reminders and track every dose."
        action={
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add medication
          </Button>
        }
      />
    </div>
  );
}
