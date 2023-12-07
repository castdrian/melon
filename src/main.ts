import { ApplicationCommandRegistries, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';

import { config } from '@src/config';
import '@sapphire/plugin-logger/register';
import '@src/listeners/_load';
import '@src/commands/_load';

ApplicationCommandRegistries.setDefaultGuildIds(config.devGuildId ? [config.devGuildId] : undefined);

const client = new SapphireClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

await client.login(config.discordToken);
