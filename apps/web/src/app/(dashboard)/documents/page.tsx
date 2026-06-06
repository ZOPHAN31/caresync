import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Advance directives, insurance cards, medical records"
      />
      <Card>
        <CardContent className="space-y-3 py-12 text-center">
          <FileText className="text-muted-foreground mx-auto h-10 w-10" />
          <p className="font-medium">Document vault</p>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">
            Secure document storage requires Supabase Storage credentials. Add SUPABASE_URL and
            SUPABASE_SERVICE_ROLE_KEY to your .env file to enable uploads.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
