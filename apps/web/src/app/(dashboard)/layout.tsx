'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  Bell,
  Calendar,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Package,
  Pill,
  Settings,
  Shield,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
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
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/care-log', label: 'Care log', icon: Heart },
  { href: '/medications', label: 'Medications', icon: Pill },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/handoffs', label: 'Handoffs', icon: ArrowLeftRight },
  { href: '/inventory', label: 'Supplies', icon: Package },
  { href: '/blueprints', label: 'Blueprints', icon: Shield },
  { href: '/family', label: 'Family', icon: Users },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function getInitials(firstName?: string, lastName?: string): string {
  const a = firstName?.[0] ?? '';
  const b = lastName?.[0] ?? '';
  return (a + b).toUpperCase() || 'CS';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'CareSync';
  const initials = getInitials(user?.firstName, user?.lastName);

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
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-sm font-medium">{fullName}</span>
                    {user?.email ? (
                      <span className="text-muted-foreground text-xs font-normal">
                        {user.email}
                      </span>
                    ) : null}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    void logout();
                  }}
                >
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
            {navItems.map(({ label, href, icon: Icon }) => (
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
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-6">{children}</main>
      </div>

      {/* Bottom tab bar (mobile) — horizontally scrollable to fit all links */}
      <nav className="bg-background fixed inset-x-0 bottom-0 z-40 border-t md:hidden">
        <div className="flex overflow-x-auto">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-w-[4.5rem] flex-shrink-0 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors',
                isActive(href) ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
