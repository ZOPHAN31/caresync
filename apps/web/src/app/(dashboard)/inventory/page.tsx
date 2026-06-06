'use client';

import { useSession } from 'next-auth/react';
import { useDashboard, useInventory, useAdjustInventory } from '@/hooks/useDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { AlertTriangle, Plus, Minus } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  location?: string;
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const primaryTeam = session?.user?.careTeams?.[0];
  const { data: dashboard } = useDashboard(primaryTeam?.careTeamId);
  const recipientId = dashboard?.recipient?.id;

  const { data: inventory, isLoading } = useInventory(recipientId);
  const adjust = useAdjustInventory();

  const grouped: Record<string, InventoryItem[]> = (inventory ?? []).reduce(
    (acc: Record<string, InventoryItem[]>, item: InventoryItem) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, InventoryItem[]>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplies & inventory"
        subtitle={
          dashboard?.recipient
            ? `${dashboard.recipient.firstName} ${dashboard.recipient.lastName}`
            : ''
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !inventory?.length ? (
        <p className="text-muted-foreground text-sm">No inventory items yet.</p>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-muted-foreground mb-3 text-sm font-medium uppercase capitalize tracking-wide">
              {category}
            </h2>
            <div className="space-y-2">
              {items.map((item) => {
                const isLow = item.currentStock <= item.minimumStock;
                return (
                  <Card key={item.id}>
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{item.name}</p>
                          {isLow && (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <AlertTriangle className="h-3 w-3" />
                              Low
                            </Badge>
                          )}
                        </div>
                        {item.location && (
                          <p className="text-muted-foreground text-xs">{item.location}</p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => adjust.mutate({ id: item.id, type: 'use', quantity: 1 })}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span
                          className={`min-w-[3rem] text-center text-sm font-medium ${isLow ? 'text-destructive' : ''}`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            adjust.mutate({ id: item.id, type: 'restock', quantity: 1 })
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
