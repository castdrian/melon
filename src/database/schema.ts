import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const guildPreferences = sqliteTable('guild_preferences', {
  id: text('id').primaryKey(),
  twitterAutoEmbed: integer('twitter_auto_embed', { mode: 'boolean' }).notNull().default(false),
  instagramAutoEmbed: integer('instagram_auto_embed', { mode: 'boolean' }).notNull().default(false),
  greetingChannelId: text('greeting_channel_id'),
  greetingMessage: text('greeting_message'),
});
