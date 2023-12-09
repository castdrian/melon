import { Command } from '@sapphire/framework';
import { CommandInteraction, time } from 'discord.js';

export class EventsCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      const { scheduledEvents: events } = interaction.guild ?? {};
      if (!events) return await interaction.reply({ content: 'No events scheduled.', ephemeral: true });
      await events.fetch();
      if (events.cache.size === 0) return await interaction.reply({ content: 'No events scheduled.', ephemeral: true });

      const eventsArray = [...events.cache.values()].slice(0, 25);

      const embed = {
        title: 'Scheduled Events',
        thumbnail: {
          url: this.container.client.user!.displayAvatarURL(),
        },
        fields: eventsArray.map((event) => ({
          name: event.name,
          value: `${time(event.scheduledStartAt!, 'R')} [open](${event.url})`,
        })),
        color: 0xd23b68,
      };

      await interaction.reply({ embeds: [embed] });
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
