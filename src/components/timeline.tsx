import styles from './timeline.module.css';

export interface TimelineEventData {
  date: string;
  type: string;
  description: string;
  action?: string;
  actionLabel?: string;
  muted?: boolean;
}

function TimelineItem({ event }: { event: TimelineEventData }) {
  return (
    <div className={`${styles.timelineItem} ${event.muted ? styles.muted : ''}`}>
      <div className={styles.stampAvatar}>
        <span className={styles.stampInitial}>
          {event.description.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className={styles.itemName}>{event.description}</div>
      <div className={styles.itemDate}>{event.date}</div>
    </div>
  );
}

interface TimelineProps {
  events: TimelineEventData[];
}

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) return null;

  return (
    <section className={styles.timelineSection}>
      <div className={styles.sectionLabel}>UPCOMING BIRTHDAYS</div>
      <div className={styles.timelineScroll}>
        {events.map((event, i) => (
          <TimelineItem key={i} event={event} />
        ))}
      </div>
    </section>
  );
}
