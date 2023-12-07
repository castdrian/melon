import { ApplyOptions } from '@sapphire/decorators';
import { Listener, type ListenerOptions, container } from '@sapphire/framework';
import { ActivityType, Client } from 'discord.js';

@ApplyOptions<ListenerOptions>({ once: true })
export class ReadyListener extends Listener {
  public async run(client: Client) {
    await client.application?.fetch();
    client.user?.setActivity({ type: ActivityType.Custom, state: 'being melon', name: 'melon' });

    const { username, id } = client.user!;
    this.container.logger.info(`Successfully logged in as ${username} (${id})`);
  }
}

void container.stores.loadPiece({
  piece: ReadyListener,
  name: 'ready',
  store: 'listeners',
});
