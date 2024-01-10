import { Command, version as sapphver } from '@sapphire/framework';
import { version as bunver } from 'bun';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, version as djsver, time } from 'discord.js';
import { cpu, mem, osInfo } from 'systeminformation';
import { version as tsver } from 'typescript';

import pkg from '@root/package.json';

export class InfoCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      const { readyAt } = this.container.client;
      const uptimeString = time(readyAt!, 'R');

      const { cores, manufacturer, brand, speedMax } = await cpu();
      const { total } = await mem();
      const { distro, release, arch } = await osInfo();

      const osString = `${distro} ${release} ${arch}`;
      const cpuString = `${cores}x ${manufacturer} ${brand} @ ${speedMax} GHz`;
      const memoryString = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${
        total / 1024 / 1024
      } MB`;

      const embed = {
        title: pkg.name,
        description: `${pkg.name} [v${pkg.version}](<https://github.com/castdrian/melon>)\n${pkg.description}\n\n**Uptime:** Container started ${uptimeString}\n**System:** ${osString}\n**CPU:** ${cpuString}\n**Memory Usage:** ${memoryString}\n\n**Bun:** [v${bunver}](<https://bun.sh/>)\n**TypeScript:** [v${tsver}](<https://www.typescriptlang.org/>)\n**Discord.js:** [v${djsver}](<https://discord.js.org/>)\n**Sapphire:** [v${sapphver}](<https://www.sapphirejs.dev/>)`,
        thumbnail: {
          url: this.container.client.user!.displayAvatarURL(),
        },
        color: 0xd23b68,
      };

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Contact')
          .setStyle(ButtonStyle.Link)
          .setURL('discord://-/users/224617799434108928'),
        new ButtonBuilder().setLabel('Discord').setStyle(ButtonStyle.Link).setURL('https://discord.gg/FmvvwgZzEX'),
        new ButtonBuilder().setLabel('GitHub').setStyle(ButtonStyle.Link).setURL('https://github.com/castdrian/melon'),
        new ButtonBuilder()
          .setLabel('Add to Server')
          .setStyle(ButtonStyle.Link)
          .setURL('https://github.com/castdrian/melon')
          .setDisabled(true),
      );

      await interaction.reply({ embeds: [embed], components: [row] });
      await interaction.followUp({
        content:
          '*This application is currently in its invite-only stage, if you wish to add it to your guild please contact [@castdrian](<https://discord.com/users/224617799434108928>) directly.*',
        ephemeral: true,
      });
    } catch (ex) {
      this.container.logger.error(ex);
    }
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName('info')
        .setDescription('info about melon'),
    );
  }
}
