'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboard } from '@/hooks/useDashboard';
import {
  useAskQuestion,
  useGenerateCarePlan,
  useMediateDisagreement,
  useGenerateDailySummary,
  useBurnoutCheck,
} from '@/hooks/useAI';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  Sparkles,
  Brain,
  Users,
  FileText,
  Heart,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';

// ─── Result display components ─────────────────────────────

function AskResult({ data }: { data: { answer: string } }) {
  return (
    <div className="bg-muted mt-4 rounded-lg p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Sparkles className="text-primary h-4 w-4" />
        Answer
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.answer}</p>
    </div>
  );
}

function DailySummaryResult({
  data,
}: {
  data: {
    narrative: string;
    highlights: string[];
    concerns: string[];
    medicationSummary: string;
    recommendationsForTomorrow: string[];
  };
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="bg-muted rounded-lg p-4">
        <p className="mb-2 text-sm font-medium">Today&apos;s summary</p>
        <p className="text-sm leading-relaxed">{data.narrative}</p>
      </div>
      {data.highlights.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Highlights
          </p>
          <ul className="space-y-1">
            {data.highlights.map((h, i) => (
              <li key={i} className="text-muted-foreground flex gap-2 text-sm">
                <span>•</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.concerns.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-500">
            <AlertTriangle className="h-4 w-4" />
            Concerns to watch
          </p>
          <ul className="space-y-1">
            {data.concerns.map((c, i) => (
              <li key={i} className="text-muted-foreground flex gap-2 text-sm">
                <span>•</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="bg-secondary rounded p-3 text-sm">
        <strong>Medications:</strong> {data.medicationSummary}
      </div>
      {data.recommendationsForTomorrow.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Recommendations for tomorrow</p>
          <ul className="space-y-1">
            {data.recommendationsForTomorrow.map((r, i) => (
              <li key={i} className="text-muted-foreground flex gap-2 text-sm">
                <span>→</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BurnoutResult({
  data,
}: {
  data: {
    riskLevel: string;
    riskScore: number;
    summary: string;
    warningSignsPresent: string[];
    recommendations: string[];
    urgentActions: string[];
    affirmation: string;
  };
}) {
  const riskColors = {
    low: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  const color = riskColors[data.riskLevel as keyof typeof riskColors] ?? riskColors.moderate;
  return (
    <div className="mt-4 space-y-4">
      <div className={`rounded-lg p-4 ${color}`}>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-medium capitalize">{data.riskLevel} burnout risk</p>
          <span className="text-lg font-bold">{data.riskScore}/100</span>
        </div>
        <p className="text-sm">{data.summary}</p>
      </div>
      {data.urgentActions.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-3">
          <p className="mb-2 text-sm font-medium text-red-700">Urgent actions needed</p>
          <ul className="space-y-1">
            {data.urgentActions.map((a, i) => (
              <li key={i} className="text-sm text-red-600">
                • {a}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.warningSignsPresent.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Warning signs detected</p>
          <ul className="space-y-1">
            {data.warningSignsPresent.map((w, i) => (
              <li key={i} className="text-muted-foreground text-sm">
                • {w}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.recommendations.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Recommendations</p>
          <ul className="space-y-1">
            {data.recommendations.map((r, i) => (
              <li key={i} className="text-muted-foreground text-sm">
                → {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm italic text-blue-700">
        {data.affirmation}
      </div>
    </div>
  );
}

function MediatorResult({
  data,
}: {
  data: {
    summary: string;
    keyConsiderations: string[];
    recommendation: string;
    suggestedNextSteps: string[];
    importantReminder: string;
  };
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm leading-relaxed">{data.summary}</p>
      </div>
      {data.keyConsiderations.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Info className="h-4 w-4" />
            Key considerations
          </p>
          <ul className="space-y-1">
            {data.keyConsiderations.map((c, i) => (
              <li key={i} className="text-muted-foreground text-sm">
                • {c}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="border-primary bg-primary/5 border-l-4 p-4">
        <p className="mb-1 text-sm font-medium">Recommendation</p>
        <p className="text-sm">{data.recommendation}</p>
      </div>
      {data.suggestedNextSteps.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Next steps</p>
          <ol className="list-inside list-decimal space-y-1">
            {data.suggestedNextSteps.map((s, i) => (
              <li key={i} className="text-muted-foreground text-sm">
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm italic text-amber-800">
        {data.importantReminder}
      </div>
    </div>
  );
}

function CarePlanResult({
  data,
}: {
  data: {
    summary: string;
    dailySchedule: { timeBlock: string; tasks: string[]; responsibleRole: string; notes: string }[];
    keyRecommendations: string[];
    redFlags: string[];
    suggestedTaskAssignments: {
      task: string;
      assignTo: string;
      frequency: string;
      priority: string;
    }[];
  };
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-4 space-y-4">
      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm leading-relaxed">{data.summary}</p>
      </div>
      {data.dailySchedule.length > 0 && (
        <div>
          <button
            className="hover:text-primary mb-2 flex items-center gap-2 text-sm font-medium"
            onClick={() => setExpanded(!expanded)}
          >
            Daily schedule{' '}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expanded && (
            <div className="space-y-3">
              {data.dailySchedule.map((block, i) => (
                <div key={i} className="rounded border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">{block.timeBlock}</p>
                    <Badge variant="outline" className="text-xs">
                      {block.responsibleRole.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <ul className="mb-2 space-y-1">
                    {block.tasks.map((task, j) => (
                      <li key={j} className="text-muted-foreground text-sm">
                        • {task}
                      </li>
                    ))}
                  </ul>
                  {block.notes && (
                    <p className="text-muted-foreground text-xs italic">{block.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {data.keyRecommendations.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Key recommendations
          </p>
          <ul className="space-y-1">
            {data.keyRecommendations.map((r, i) => (
              <li key={i} className="text-muted-foreground text-sm">
                → {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.redFlags.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-red-500">
            <AlertTriangle className="h-4 w-4" />
            Red flags to watch for
          </p>
          <ul className="space-y-1">
            {data.redFlags.map((f, i) => (
              <li key={i} className="text-muted-foreground text-sm">
                • {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────

export default function AIPage() {
  const { data: session } = useSession();
  const primaryTeam = session?.user?.careTeams?.[0];
  const { data: dashboard } = useDashboard(primaryTeam?.careTeamId);
  const recipientId = dashboard?.recipient?.id;

  const [question, setQuestion] = useState('');
  const [situation, setSituation] = useState('');
  const [schedules, setSchedules] = useState('');
  const [challenges, setChallenges] = useState('');
  const [stressLevel, setStressLevel] = useState('');

  const ask = useAskQuestion();
  const carePlan = useGenerateCarePlan();
  const mediate = useMediateDisagreement();
  const dailySummary = useGenerateDailySummary();
  const burnout = useBurnoutCheck();

  if (!recipientId) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI assistant" />
        <p className="text-muted-foreground text-sm">
          Set up a care recipient first to use AI features.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI assistant"
        subtitle={`Powered by Gemini · ${dashboard?.recipient?.firstName} ${dashboard?.recipient?.lastName}`}
      />

      <div className="bg-muted text-muted-foreground flex items-start gap-3 rounded-lg p-4 text-sm">
        <Sparkles className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          CareSync&apos;s AI assistant is trained on caregiving best practices and has context about{' '}
          {dashboard?.recipient?.firstName}&apos;s specific diagnoses, medications, and care
          history. Ask anything.
        </p>
      </div>

      {/* Ask a question */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="text-primary h-5 w-5" />
            <CardTitle className="text-base">Ask a caregiving question</CardTitle>
          </div>
          <CardDescription>
            Get personalized guidance based on {dashboard?.recipient?.firstName}&apos;s specific
            situation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={`e.g. "How should I handle sundowning?" or "What are signs that ${dashboard?.recipient?.firstName}'s Parkinson's is progressing?"`}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
          />
          <Button
            onClick={() => ask.mutate({ recipientId, question })}
            disabled={ask.isPending || question.length < 5}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {ask.isPending ? 'Thinking...' : 'Ask Gemini'}
          </Button>
          {ask.data && <AskResult data={ask.data} />}
          {ask.error && <p className="text-destructive text-sm">Error: {String(ask.error)}</p>}
        </CardContent>
      </Card>

      {/* Daily summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="text-primary h-5 w-5" />
            <CardTitle className="text-base">Generate today&apos;s summary</CardTitle>
          </div>
          <CardDescription>
            A professional narrative of today&apos;s care activity — share with family or healthcare
            providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => dailySummary.mutate({ recipientId })}
            disabled={dailySummary.isPending}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {dailySummary.isPending ? 'Generating...' : 'Generate summary'}
          </Button>
          {dailySummary.data && <DailySummaryResult data={dailySummary.data} />}
          {dailySummary.error && (
            <p className="text-destructive mt-3 text-sm">Error: {String(dailySummary.error)}</p>
          )}
        </CardContent>
      </Card>

      {/* Burnout check */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="text-primary h-5 w-5" />
            <CardTitle className="text-base">Caregiver burnout check</CardTitle>
          </div>
          <CardDescription>
            Analyzes your activity over the last 30 days to assess burnout risk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>How are you feeling? (optional)</Label>
            <Textarea
              placeholder="Describe your current stress level, energy, emotional state..."
              value={stressLevel}
              onChange={(e) => setStressLevel(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            onClick={() => burnout.mutate({ selfReportedStress: stressLevel || undefined })}
            disabled={burnout.isPending}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {burnout.isPending ? 'Assessing...' : 'Check my burnout risk'}
          </Button>
          {burnout.data && <BurnoutResult data={burnout.data} />}
          {burnout.error && (
            <p className="text-destructive mt-3 text-sm">Error: {String(burnout.error)}</p>
          )}
        </CardContent>
      </Card>

      {/* Family mediator */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="text-primary h-5 w-5" />
            <CardTitle className="text-base">Family mediator</CardTitle>
          </div>
          <CardDescription>
            Neutral AI mediation for difficult caregiving decisions and family disagreements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Describe the situation *</Label>
            <Textarea
              placeholder="e.g. 'We disagree about whether Dad should move to memory care. One sibling thinks it's time, another thinks we can manage at home...'"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              rows={4}
            />
          </div>
          <Button
            onClick={() => mediate.mutate({ recipientId, situation })}
            disabled={mediate.isPending || situation.length < 10}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {mediate.isPending ? 'Mediating...' : 'Get AI mediation'}
          </Button>
          {mediate.data && <MediatorResult data={mediate.data} />}
          {mediate.error && (
            <p className="text-destructive mt-3 text-sm">Error: {String(mediate.error)}</p>
          )}
        </CardContent>
      </Card>

      {/* Care plan generator */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="text-primary h-5 w-5" />
            <CardTitle className="text-base">Generate care plan</CardTitle>
          </div>
          <CardDescription>
            AI-powered care plan tailored to {dashboard?.recipient?.firstName}&apos;s specific needs
            and your family&apos;s schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Caregiver schedules *</Label>
            <Textarea
              placeholder="e.g. 'Maria works Monday-Friday 8am-4pm. Narrissa covers evenings 4pm-9pm and all day weekends. Marcus can help Sundays.'"
              value={schedules}
              onChange={(e) => setSchedules(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Specific challenges *</Label>
            <Textarea
              placeholder="e.g. 'Sundowning happens around 3-4pm. Refuses medications sometimes. Difficulty with bathing. Falls risk when moving from bed.'"
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              rows={3}
            />
          </div>
          <Button
            onClick={() =>
              carePlan.mutate({
                recipientId,
                caregiverSchedules: schedules,
                specificChallenges: challenges,
              })
            }
            disabled={carePlan.isPending || schedules.length < 5 || challenges.length < 5}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {carePlan.isPending ? 'Generating care plan...' : 'Generate care plan'}
          </Button>
          {carePlan.data && <CarePlanResult data={carePlan.data} />}
          {carePlan.error && (
            <p className="text-destructive mt-3 text-sm">Error: {String(carePlan.error)}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
