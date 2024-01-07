import { ApplicationCommandRegistries, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';

import { config } from '@src/config';
import '@sapphire/plugin-logger/register';

ApplicationCommandRegistries.setDefaultGuildIds(config.devGuildId ? [config.devGuildId] : undefined);

const client = new SapphireClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

await client.login(config.discordToken);
