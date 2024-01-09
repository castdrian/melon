import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction } from 'discord.js';

import { getOrCreateGuildSettings, updateGuildSettings } from '@src/database/db';

enum ButtonEmoji {
  ENABLED = '1194304761386770512',
  DISABLED = '1194304728830582785',
}

export class SettingsCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      if (!interaction.isChatInputCommand()) return;
      if (!interaction.guildId) return;

      await interaction.reply(await constructResponse());

      async function constructResponse(disabled = false) {
        const settings = await getOrCreateGuildSettings(interaction.guildId!);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('twitter')
            .setLabel('Embed Tweets')
            .setDisabled(disabled)
            .setEmoji(settings.twitterAutoEmbed ? ButtonEmoji.ENABLED : ButtonEmoji.DISABLED)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('instagram')
            .setLabel('Embed Instagram Posts')
            .setDisabled(disabled)
            .setEmoji(settings.instagramAutoEmbed ? ButtonEmoji.ENABLED : ButtonEmoji.DISABLED)
            .setStyle(ButtonStyle.Primary),
        );

        return { content: `Current settings:`, components: [row] };
      }

      const collector = interaction.channel!.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 30000,
      });

      async function updateEmbedSettings(customId: string) {
        const settings = await getOrCreateGuildSettings(interaction.guildId!);
        const settingKey = customId === 'twitter' ? 'twitterAutoEmbed' : 'instagramAutoEmbed';
        const settingValue = !settings[settingKey];

        await updateGuildSettings(interaction.guildId!, { [settingKey]: settingValue });
      }

      collector.on('collect', async (i) => {
        if (i.customId === 'twitter' || i.customId === 'instagram') {
          await updateEmbedSettings(i.customId);
          await i.update(await constructResponse());
        }
      });

      collector.on('end', async () => {
        await interaction.editReply(await constructResponse(true));
      });
    } catch (ex) {
      this.container.logger.error(ex);
    }
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName('settings')
        .setDescription('configure guild settings')
        .setDefaultMemberPermissions(0),
    );
  }
}
