import * as path from 'path';

import { Command, container } from '@sapphire/framework';
import { ApplicationCommandType, Message, MessageContextMenuCommandInteraction } from 'discord.js';

export class DeezNutsCommand extends Command {
  public override async contextMenuRun(interaction: MessageContextMenuCommandInteraction) {
    try {
      if (!interaction.isMessageContextMenuCommand && !(interaction.targetMessage instanceof Message)) return;
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const filePath = path.join(__dirname, '..', '..', 'media', 'DEEZNUTS.mov');

      await interaction.reply({ content: interaction.targetMessage.author.toString(), files: [filePath] });
    } catch (ex) {
      this.container.logger.error(ex);
    }
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerContextMenuCommand((builder) =>
      builder //
        .setName('DEEZ NUTS')
        .setType(ApplicationCommandType.Message),
    );
  }
}

void container.stores.loadPiece({
  piece: DeezNutsCommand,
  name: 'deeznuts',
  store: 'commands',
});
