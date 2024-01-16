import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ChannelType,
  CommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

export class InfoCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      if (!interaction.isChatInputCommand()) return;
      const channel = interaction.options.getChannel('channel', true, [
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
      ]);

      const modal = new ModalBuilder()
        .setCustomId('post_message_modal')
        .setTitle(`Send message to ${channel.name}`)
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('post_message_content')
              .setStyle(TextInputStyle.Paragraph)
              .setLabel('Message Content')
              .setRequired(true)
              .setMaxLength(2000),
          ),
        );

      await interaction.showModal(modal);

      const submit = await interaction
        .awaitModalSubmit({
          filter: (i) => i.customId === 'post_message_modal',
          time: 60000,
        })
        .catch(() => interaction.followUp({ content: 'Message modal timed out.', ephemeral: true }));

      if (submit instanceof ModalSubmitInteraction) {
        await submit.deferUpdate();

        const content = submit.fields.getTextInputValue('post_message_content');
        const attachment = interaction.options.getAttachment('attachment');

        await channel.send({ content, files: attachment ? [attachment] : undefined });
      }
    } catch (ex) {
      this.container.logger.error(ex);
    }
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName('post')
        .setDescription('send message to channel')
        .addChannelOption((option) =>
          option //
            .setName('channel')
            .setDescription('channel to send message to')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        )
        .addAttachmentOption((option) =>
          option //
            .setName('attachment')
            .setDescription('attachment to send'),
        )
        .setDefaultMemberPermissions(0),
    );
  }
}
