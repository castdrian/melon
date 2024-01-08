import { ApplicationCommandRegistries, SapphireClient } from '@sapphire/framework';
import { Database } from 'bun:sqlite';
import { GatewayIntentBits } from 'discord.js';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import '@sapphire/plugin-logger/register';

import { config } from '@src/config';

ApplicationCommandRegistries.setDefaultGuildIds(config.devGuildId ? [config.devGuildId] : undefined);

const client = new SapphireClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const sqlite = new Database(config.devGuildId ? ':memory:' : 'melon.db', { create: true });
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: './src/database/drizzle' });

await client.login(config.discordToken);
