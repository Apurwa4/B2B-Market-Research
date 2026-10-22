import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const companies = sqliteTable('companies', { id: text('id').primaryKey(), data: text('data').notNull(), updatedAt: text('updated_at').notNull() });
export const settings = sqliteTable('settings', { key: text('key').primaryKey(), value: text('value').notNull() });
