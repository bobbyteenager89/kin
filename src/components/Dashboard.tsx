import { Timeline, type TimelineEventData } from './Timeline';
import { FriendCard, type FriendCardData } from './FriendCard';
import styles from './Dashboard.module.css';

const timelineEvents: TimelineEventData[] = [
  {
    date: 'This Friday',
    type: 'Birthday',
    description: "Sarah's 32nd Birthday",
    actionLabel: 'Send a gift →',
  },
  {
    date: 'Nov 14',
    type: 'Anniversary',
    description: 'Mark & Elena (5 years)',
    actionLabel: 'Set reminder',
  },
  {
    date: 'Dec 2',
    type: 'Kids Birthday',
    description: 'Leo turns 4',
    muted: true,
  },
];

const friends: FriendCardData[] = [
  {
    name: 'Sarah Jenkins',
    relation: 'College Roommate',
    avatarUrl: 'https://i.pravatar.cc/300?img=47',
    featured: true,
    details: [
      { label: 'Birthday', value: 'October 28 🎈' },
      { label: 'Partner', value: 'David' },
      { label: 'Address', value: '124 Maple St, Austin TX' },
      { label: 'Last Caught Up', value: '3 weeks ago', accent: true },
    ],
  },
  {
    name: 'Mark Torres',
    relation: 'Work buddy',
    avatarUrl: 'https://i.pravatar.cc/150?img=11',
    tags: ['Anniv: Nov 14', 'Dog: Buster'],
  },
  {
    name: 'Elena Rostova',
    relation: 'Book club',
    avatarUrl: 'https://i.pravatar.cc/150?img=32',
    tags: ['Vegan 🌱', 'Kid: Leo (3)'],
  },
  {
    name: 'James Chen',
    relation: 'Brother-in-law',
    avatarUrl: 'https://i.pravatar.cc/150?img=68',
    tags: ['Bday: Jan 4'],
  },
  {
    name: 'Chloe Smith',
    relation: 'Neighbor',
    avatarUrl: 'https://i.pravatar.cc/150?img=44',
    tags: ['Owes me coffee'],
  },
];

export function Dashboard() {
  return (
    <main className={styles.dashboardGrid}>
      <Timeline events={timelineEvents} />

      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Circle</h2>
          <span className={styles.sectionAccent}>fresh & updated</span>
        </div>

        <div className={styles.rosterGrid}>
          {friends.map((friend, i) => (
            <FriendCard key={i} friend={friend} />
          ))}
        </div>
      </section>
    </main>
  );
}
