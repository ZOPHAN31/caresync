'use client';

import { useSession } from 'next-auth/react';
import { useCareTeam } from '@/hooks/useDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function formatRole(role: string) {
  return role
    .split('_')
    .map((w: string) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const ROLE_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  PRIMARY_CAREGIVER: 'default',
  SECONDARY_CAREGIVER: 'secondary',
  FAMILY_MEMBER: 'outline',
  MEDICAL_COORDINATOR: 'secondary',
  FINANCIAL_COORDINATOR: 'outline',
  CARE_RECIPIENT: 'outline',
};

export default function FamilyPage() {
  const { data: session } = useSession();
  const primaryTeam = session?.user?.careTeams?.[0];
  const { data: team, isLoading } = useCareTeam(primaryTeam?.careTeamId);

  return (
    <div className="space-y-6">
      <PageHeader title="Care team" subtitle={team?.name ?? primaryTeam?.careTeamName ?? ''} />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !team?.members?.length ? (
        <p className="text-muted-foreground text-sm">No team members found.</p>
      ) : (
        <div className="space-y-3">
          {team.members.map(
            (member: {
              userId: string;
              role: string;
              isAdmin: boolean;
              joinedAt: string;
              user: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
                phone?: string;
                avatarUrl?: string;
              };
            }) => (
              <Card key={member.userId}>
                <CardContent className="flex items-center gap-4 py-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="text-sm">
                      {getInitials(member.user.firstName, member.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      {member.user.id === session?.user?.id && (
                        <span className="text-muted-foreground text-xs">(you)</span>
                      )}
                      {member.isAdmin && (
                        <Badge variant="outline" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">{member.user.email}</p>
                    {member.user.phone && (
                      <p className="text-muted-foreground text-xs">{member.user.phone}</p>
                    )}
                  </div>
                  <Badge
                    variant={ROLE_COLORS[member.role] ?? 'outline'}
                    className="flex-shrink-0 text-xs"
                  >
                    {formatRole(member.role)}
                  </Badge>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {team?.invites?.length > 0 && (
        <div>
          <h2 className="text-muted-foreground mb-3 text-sm font-medium uppercase tracking-wide">
            Pending invites
          </h2>
          <div className="space-y-2">
            {team.invites.map(
              (invite: { id: string; email: string; role: string; expiresAt: string }) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded border p-3 text-sm"
                >
                  <span className="text-muted-foreground">{invite.email}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {formatRole(invite.role)}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
