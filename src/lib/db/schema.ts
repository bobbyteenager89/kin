import { pgTable, uuid, text, date, boolean, timestamp, jsonb, pgEnum, integer } from 'drizzle-orm/pg-core';

export const eventTypeEnum = pgEnum('event_type', [
  'birthday', 'anniversary', 'kids_birthday', 'address_change', 'custom',
]);

export const eventSourceEnum = pgEnum('event_source', [
  'manual', 'gmail_import', 'calendar_sync', 'public_calendar', 'ai_generated',
]);

export const importStatusEnum = pgEnum('import_status', [
  'pending', 'approved', 'dismissed',
]);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  notificationPrefs: jsonb('notification_prefs').$type<{
    birthdayDaysBefore: number;
    anniversaryDaysBefore: number;
    enabled: boolean;
  }>().default({ birthdayDaysBefore: 1, anniversaryDaysBefore: 7, enabled: true }),
  aiCalendarQuota: integer('ai_calendar_quota').default(5).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const persons = pgTable('persons', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerUserId: text('owner_user_id').notNull().references(() => users.id),
  claimedByUserId: text('claimed_by_user_id'),
  name: text('name').notNull(),
  nickname: text('nickname'),
  avatarUrl: text('avatar_url'),
  relation: text('relation'),
  birthday: date('birthday'),
  partnerName: text('partner_name'),
  weddingAnniversary: date('wedding_anniversary'),
  address: jsonb('address').$type<{
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  }>(),
  phone: text('phone'),
  email: text('email'),
  tags: text('tags').array().default([]),
  notes: text('notes'),
  lastCaughtUp: timestamp('last_caught_up'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const children = pgTable('children', {
  id: uuid('id').defaultRandom().primaryKey(),
  personId: uuid('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  birthday: date('birthday'),
});

export const publicCalendars = pgTable('public_calendars', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  isAiGenerated: boolean('is_ai_generated').default(false).notNull(),
  createdByUserId: text('created_by_user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  personId: uuid('person_id').references(() => persons.id, { onDelete: 'cascade' }),
  calendarId: uuid('calendar_id').references(() => publicCalendars.id, { onDelete: 'cascade' }),
  type: eventTypeEnum('type').notNull(),
  title: text('title').notNull(),
  date: date('date').notNull(),
  recurring: boolean('recurring').default(false).notNull(),
  description: text('description'),
  source: eventSourceEnum('source').notNull(),
  googleCalendarEventId: text('google_calendar_event_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const importSuggestions = pgTable('import_suggestions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  source: text('source').notNull(),
  emailSubject: text('email_subject').notNull(),
  extractedData: jsonb('extracted_data').$type<{
    hostName?: string;
    eventName?: string;
    date?: string;
    location?: string;
  }>().notNull(),
  status: importStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const calendarSubscriptions = pgTable('calendar_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  calendarId: uuid('calendar_id').notNull().references(() => publicCalendars.id, { onDelete: 'cascade' }),
  googleCalendarId: text('google_calendar_id'),
  subscribedAt: timestamp('subscribed_at').defaultNow().notNull(),
});
