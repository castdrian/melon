import { Database } from 'bun:sqlite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sqlite';

import * as schema from '@src/database/schema';

const sqlite = new Database('melon.db');
export const db = drizzle(sqlite, { schema });

export type GuildSettings = typeof schema.guildPreferences.$inferSelect;

export async function getOrCreateGuildSettings(guildId: string) {
  const existingSettings = await db
    .select()
    .from(schema.guildPreferences)
    .where(eq(schema.guildPreferences.id, guildId))
    .limit(1);

  if (existingSettings.length > 0) {
    return existingSettings[0];
  }

  const newSettings = {
    id: guildId,
    twitterAutoEmbed: false,
    instagramAutoEmbed: false,
    greetingChannelId: null,
    greetingMessage: null,
  };

  const createdSettings = await db.insert(schema.guildPreferences).values(newSettings).returning();
  return createdSettings[0];
}

export async function updateGuildSettings(guildId: string, newSettings: Partial<GuildSettings>) {
  await db.update(schema.guildPreferences).set(newSettings).where(eq(schema.guildPreferences.id, guildId)).returning();
  return getOrCreateGuildSettings(guildId);
}

export async function isTwitterAutoEmbedEnabled(guildId: string) {
  const settings = await getOrCreateGuildSettings(guildId);
  return settings.twitterAutoEmbed;
}

export async function isInstagramAutoEmbedEnabled(guildId: string) {
  const settings = await getOrCreateGuildSettings(guildId);
  return settings.instagramAutoEmbed;
}
