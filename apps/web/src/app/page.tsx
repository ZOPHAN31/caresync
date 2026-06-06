import Link from 'next/link';
import { CalendarHeart, HeartHandshake, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

const features = [
  {
    icon: CalendarHeart,
    title: 'Everything in one place',
    description:
      'Care logs, medications, tasks, and documents live together — no more scattered notes, texts, and spreadsheets.',
  },
  {
    icon: HeartHandshake,
    title: 'Family coordination',
    description:
      'Invite siblings, caregivers, and coordinators. Everyone sees the same picture and stays in sync in real time.',
  },
  {
    icon: Sparkles,
    title: 'AI-powered planning',
    description:
      'Turn a wall of notes into clear next steps, summaries, and reminders with planning assistance built in.',
  },
];

export default function LandingPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="border-b">
        <nav className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            CareSync
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container flex flex-col items-center py-20 text-center sm:py-28">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Family caregiving, finally coordinated.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-lg">
            CareSync brings together everything your family needs — care logs, medications, tasks,
            documents, and AI-powered planning — in one place.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">Start for free</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="#features">See how it works</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-muted/30 border-t py-20">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="bg-card text-card-foreground flex flex-col items-start gap-4 rounded-lg border p-6 shadow-sm"
                >
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <Icon className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-sm">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="text-muted-foreground container flex h-16 items-center justify-center text-sm">
          <p>© 2025 CareSync · Privacy · Terms</p>
        </div>
      </footer>
    </div>
  );
}
