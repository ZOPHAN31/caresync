'use client';

import { FileText, Upload } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export default function DocumentsPage() {
  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Store insurance, medical records, and important paperwork."
        action={
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        }
      />
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Upload insurance cards, medical records, and legal documents to keep them in one secure place."
        action={
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload document
          </Button>
        }
      />
    </div>
  );
}
