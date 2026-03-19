import { auth } from '@clerk/nextjs/server';
import { DashboardClient } from '@/components/dashboard-client';
import { getPersonsByUser } from '@/lib/queries/persons';
import { getUpcomingEvents } from '@/lib/queries/events';
import type { FriendCardData } from '@/components/friend-card';
import type { TimelineEventData } from '@/components/timeline';

function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `This ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.now() + days * 86400000).getDay()]}`;
  const d = new Date(Date.now() + days * 86400000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatEventType(type: string): string {
  const map: Record<string, string> = {
    birthday: 'Birthday',
    anniversary: 'Anniversary',
    kids_birthday: 'Kids Birthday',
    custom: 'Event',
  };
  return map[type] ?? type;
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null; // Middleware handles redirect

  const [personRows, upcomingEvents] = await Promise.all([
    getPersonsByUser(userId),
    getUpcomingEvents(userId, 8),
  ]);

  // Find the person with the nearest upcoming event for "featured" slot
  const featuredPersonId = upcomingEvents[0]?.personId ?? null;

  const friends: FriendCardData[] = personRows.map((p) => ({
    id: p.id,
    name: p.name,
    relation: p.relation,
    avatarUrl: p.avatarUrl,
    tags: p.tags ?? [],
    tier: p.tier,
    featured: p.id === featuredPersonId,
    addressVerifiedAt: p.addressVerifiedAt,
  }));

  const timelineEvents: TimelineEventData[] = upcomingEvents.map((ev) => ({
    date: formatDaysUntil(ev.daysUntil),
    type: formatEventType(ev.type),
    description: ev.title,
    muted: ev.type === 'kids_birthday',
  }));

  return (
    <DashboardClient
      persons={friends}
      events={timelineEvents}
    />
  );
}
