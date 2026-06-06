'use client';

import { Plus, Users } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export default function FamilyPage() {
  return (
    <div>
      <PageHeader
        title="Family"
        subtitle="Coordinate caregivers, family members, and care teams."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite member
          </Button>
        }
      />
      <EmptyState
        icon={Users}
        title="Build your care team"
        description="Invite siblings, caregivers, and coordinators so everyone stays in sync."
        action={
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Invite member
          </Button>
        }
      />
    </div>
  );
}
