'use client';

import { NotebookPen, Plus } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export default function CareLogPage() {
  return (
    <div>
      <PageHeader
        title="Care Log"
        subtitle="Track meals, medications, mood, and daily notes."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New entry
          </Button>
        }
      />
      <EmptyState
        icon={NotebookPen}
        title="No care log entries yet"
        description="Log the first activity to start building a timeline your whole family can follow."
        action={
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add entry
          </Button>
        }
      />
    </div>
  );
}
