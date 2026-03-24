import { pgTable, uuid, text, date, boolean, timestamp, jsonb, pgEnum, integer } from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────

export const eventTypeEnum = pgEnum('event_type', [
  'birthday', 'anniversary', 'kids_birthday', 'custom',
]);

export const eventSourceEnum = pgEnum('event_source', [
  'manual', 'address_request',
]);

export const tierEnum = pgEnum('tier', [
  'everyone', 'friends', 'inner_circle',
]);

export const friendshipStatusEnum = pgEnum('friendship_status', [
  'pending', 'active',
]);

export const addressRequestStatusEnum = pgEnum('address_request_status', [
  'pending', 'completed', 'expired',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'added_to_circle', 'address_request', 'birthday_reminder',
  'verify_address', 'wishlist_purchased',
]);

// ── Users ──────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  phone: text('phone'),
  city: text('city'),
  bio: text('bio'),
  notificationPrefs: jsonb('notification_prefs').$type<{
    birthdayDaysBefore: number;
    enabled: boolean;
  }>().default({ birthdayDaysBefore: 1, enabled: true }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Persons (contacts) ────────────────────────────────────

export const persons = pgTable('persons', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerUserId: text('owner_user_id').notNull().references(() => users.id),
  claimedByUserId: text('claimed_by_user_id'),
  name: text('name').notNull(),
  nickname: text('nickname'),
  avatarUrl: text('avatar_url'),
  relation: text('relation'),
  birthday: date('birthday'), // Sentinel year 1904 if year unknown
  partnerName: text('partner_name'),
  weddingAnniversary: date('wedding_anniversary'),
  address: jsonb('address').$type<{
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  }>(),
  addressVerifiedAt: timestamp('address_verified_at'),
  phone: text('phone'),
  email: text('email'),
  tags: text('tags').array().default([]),
  notes: text('notes'),
  lastCaughtUp: timestamp('last_caught_up'),
  tier: tierEnum('tier').default('everyone').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Children ──────────────────────────────────────────────

export const children = pgTable('children', {
  id: uuid('id').defaultRandom().primaryKey(),
  personId: uuid('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  birthday: date('birthday'),
});

// ── Friendships (mutual connections) ──────────────────────

export const friendships = pgTable('friendships', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  friendUserId: text('friend_user_id').notNull().references(() => users.id),
  tier: tierEnum('tier').default('everyone').notNull(),
  status: friendshipStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Address Requests ──────────────────────────────────────

export const addressRequests = pgTable('address_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: text('sender_id').notNull().references(() => users.id),
  recipientPersonId: uuid('recipient_person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(), // URL-safe random string
  recipientPhone: text('recipient_phone'),
  recipientEmail: text('recipient_email'),
  message: text('message'), // Personal note from sender
  status: addressRequestStatusEnum('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Wishlists ─────────────────────────────────────────────

export const wishlists = pgTable('wishlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const wishlistItems = pgTable('wishlist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  wishlistId: uuid('wishlist_id').notNull().references(() => wishlists.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url'),
  notes: text('notes'),
  priority: integer('priority').default(2).notNull(), // 1=high, 3=low
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const wishlistPurchases = pgTable('wishlist_purchases', {
  id: uuid('id').defaultRandom().primaryKey(),
  wishlistItemId: uuid('wishlist_item_id').notNull().references(() => wishlistItems.id, { onDelete: 'cascade' }),
  purchasedByUserId: text('purchased_by_user_id').notNull().references(() => users.id),
  hiddenFromUserId: text('hidden_from_user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Notifications ─────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: notificationTypeEnum('type').notNull(),
  data: jsonb('data').$type<Record<string, unknown>>().default({}).notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Events ────────────────────────────────────────────────

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  personId: uuid('person_id').references(() => persons.id, { onDelete: 'cascade' }),
  type: eventTypeEnum('type').notNull(),
  title: text('title').notNull(),
  date: date('date').notNull(),
  recurring: boolean('recurring').default(false).notNull(),
  source: eventSourceEnum('source').default('manual').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Push Tokens ────────────────────────────────────────────

export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  token: text('token').notNull(),
  platform: text('platform').notNull().default('ios'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
