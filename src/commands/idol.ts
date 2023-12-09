import * as path from 'path';

import { Command } from '@sapphire/framework';
import { ApplicationCommandType, Message, MessageContextMenuCommandInteraction } from 'discord.js';

export class IdolCommand extends Command {
  public override async contextMenuRun(interaction: MessageContextMenuCommandInteraction) {
    try {
      if (!interaction.isMessageContextMenuCommand && !(interaction.targetMessage instanceof Message)) return;

      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const filePath = path.join(__dirname, '..', '..', 'media', 'IDOL.mp4');

      await interaction.reply({ content: interaction.targetMessage.author.toString(), files: [filePath] });
    } catch (ex) {
      this.container.logger.error(ex);
    }
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerContextMenuCommand((builder) =>
      builder //
        .setName('IDOL moment')
        .setType(ApplicationCommandType.Message),
    );
  }
}
