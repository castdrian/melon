import { LogLevel, SapphireClient } from "@sapphire/framework";
import { ActivityType, GatewayIntentBits } from "discord.js";
import { config } from '@src/config'
import '@sapphire/plugin-logger/register';

const client = new SapphireClient(
	{
		intents: [GatewayIntentBits.Guilds],
		logger: {
			level: LogLevel.Debug
		}
	}
);

await client.login(config.discordToken)