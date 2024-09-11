import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import { type CommandInteraction, time } from 'discord.js';

import { MELON_COLOR } from '@root/src/config';

export class EventsCommand extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		try {
			if (!interaction.isChatInputCommand()) return;
			if (!interaction.inCachedGuild()) return;

			const { scheduledEvents } = interaction.guild;
			const events = await scheduledEvents.fetch();
			if (events.size === 0) return await interaction.reply({ content: 'No events scheduled.', ephemeral: true });

			const eventsArray = [...events.values()];
			const pages = [];

			while (eventsArray.length) {
				pages.push(eventsArray.splice(0, 10));
			}

			const paginatedMessage = new PaginatedMessage();

			for (const page of pages) {
				const embed = {
					title: 'Scheduled Events',
					thumbnail: {
						url: interaction.guild?.iconURL() ?? interaction.client.user.displayAvatarURL(),
					},
					fields: page.map((event) => ({
						name: event.name,
						value: `${time(event.scheduledStartAt!, 'R')} ${time(event.scheduledStartAt!)} [event details](${event.url
							})`,
					})),
					color: MELON_COLOR,
				};

				paginatedMessage.addPageEmbed(embed);
			}

			await paginatedMessage.run(interaction);
		} catch (ex) {
			this.container.logger.error(ex);
		}
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName('events')
				.setDescription('display scheduled events'),
		);
	}
}
