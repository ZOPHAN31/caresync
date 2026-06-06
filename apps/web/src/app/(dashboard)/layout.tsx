'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  NotebookPen,
  Pill,
  Settings,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Care Log', href: '/care-log', icon: NotebookPen },
  { title: 'Medications', href: '/medications', icon: Pill },
  { title: 'Family', href: '/family', icon: Users },
  { title: 'Documents', href: '/documents', icon: FileText },
  { title: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="bg-background sticky top-0 z-40 border-b">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            CareSync
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>CS</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 border-r md:block">
          <nav className="sticky top-16 flex flex-col gap-1 p-4">
            {navItems.map(({ title, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {title}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-6">{children}</main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav className="bg-background fixed inset-x-0 bottom-0 z-40 border-t md:hidden">
        <div className="grid grid-cols-6">
          {navItems.map(({ title, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors',
                isActive(href) ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{title}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
