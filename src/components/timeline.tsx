import styles from './timeline.module.css';

export interface TimelineEventData {
  date: string;
  type: string;
  description: string;
  action?: string;
  actionLabel?: string;
  muted?: boolean;
}

function TimelineEvent({ event }: { event: TimelineEventData }) {
  return (
    <div className={styles.timelineEvent}>
      <div
        className={styles.timelineDot}
        style={event.muted ? { borderColor: 'var(--text-muted)', background: 'transparent' } : undefined}
      />
      <span className={styles.eventDate}>{event.date}</span>
      <div className={styles.eventCard} style={event.muted ? { opacity: 0.7 } : undefined}>
        <div
          className={styles.eventType}
          style={event.muted ? { color: 'var(--text-muted)' } : undefined}
        >
          {event.type}
        </div>
        <div className={styles.eventDesc}>{event.description}</div>
        {event.actionLabel && (
          <a href={event.action ?? '#'} className={styles.eventAction}>
            {event.actionLabel}
          </a>
        )}
      </div>
    </div>
  );
}

interface TimelineProps {
  events: TimelineEventData[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <aside>
      <div className={styles.timelineHeader}>
        <h2 className={styles.sectionTitle}>Coming Up</h2>
        <span className={styles.sectionAccent}>soon</span>
      </div>

      <div className={styles.timeline}>
        {events.map((event, i) => (
          <TimelineEvent key={i} event={event} />
        ))}
      </div>
    </aside>
  );
}
