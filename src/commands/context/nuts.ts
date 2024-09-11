import * as path from 'node:path';

import { Command } from '@sapphire/framework';
import { ApplicationCommandType, Message, type MessageContextMenuCommandInteraction } from 'discord.js';

export class DeezNutsCommand extends Command {
	public override async contextMenuRun(interaction: MessageContextMenuCommandInteraction) {
		try {
			if (!interaction.isMessageContextMenuCommand && !(interaction.targetMessage instanceof Message)) return;
			const __dirname = path.dirname(new URL(import.meta.url).pathname);
			const one = path.join(__dirname, '..', '..', '..', 'media', 'DEEZNUTS.mov');
			const two = path.join(__dirname, '..', '..', '..', 'media', 'RYUJINDN.mp4');

			const filePath = Math.random() > 0.5 ? one : two;

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
