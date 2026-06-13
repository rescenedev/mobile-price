import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Drizzle D1(SQLite) 스키마 — 단일 출처.
 * 타임스탬프는 epoch ms 정수로 저장(정렬/비교 안정성). 표시용 변환은 dayjs/date-fns로.
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type TUserRow = typeof users.$inferSelect;
export type TUserInsert = typeof users.$inferInsert;
export type TNoteRow = typeof notes.$inferSelect;
export type TNoteInsert = typeof notes.$inferInsert;
