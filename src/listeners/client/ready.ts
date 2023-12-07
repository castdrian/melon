import { ApplyOptions } from '@sapphire/decorators';
import { Listener, type ListenerOptions } from '@sapphire/framework';
import { ActivityType, Client } from 'discord.js';

@ApplyOptions<ListenerOptions>({ once: true })
export class ReadyListener extends Listener {
	public run(client: Client) {
		client.user?.setActivity({ type: ActivityType.Custom, state: 'being melon', name: 'melon' })

		const { username, id } = client.user!;
		this.container.logger.info(`Successfully logged in as ${username} (${id})`);
	}
}
