import { Command } from '@sapphire/framework';
import { AutocompleteInteraction, CommandInteraction, time } from 'discord.js';
import { search } from 'fast-fuzzy';
import kpop, { Idol } from 'kpopnet.json';

export class SearchCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      const { value } = interaction.options.get('query', true);
      const { idols, groups } = kpop;

      const idol = idols.find((i) => i.id === value);
      const group = groups.find((g) => g.id === value);

      if (!idol && !group) {
        return interaction.reply('Could not find an idol or group with that ID.');
      }

      if (idol) {
        const embed = {
          title: `${idol.name} (${idol.name_original})`,
          description: `**Real Name:** ${
            idol.real_name ? `${idol.real_name} (${idol.real_name_original})\n` : ''
          }**Birth Date:** ${time(new Date(idol.birth_date), 'D')} (${time(
            new Date(idol.birth_date),
            'R',
          )})\n**Debut Date:** ${
            idol.debut_date ? `${time(new Date(idol.debut_date), 'D')} (${time(new Date(idol.debut_date), 'R')})` : ''
          }${idol.height ? `\n**Height:** ${idol.height} CM` : ''}${
            idol.weight ? `\n**Weight:** ${idol.weight} KG` : ''
          }\n\n**Groups:**\n${idol.groups.map((id) => groups.find((grp) => grp.id === id)!.name).join('\n')}`,
          thumbnail: {
            url: idol.thumb_url!,
          },
          color: 0xd23b68,
        };
        return interaction.reply({ embeds: [embed] });
      }

      if (group) {
        const embed = {
          title: `${group.name} (${group.name_original})`,
          description: `**Agency:** ${group.agency_name}\n**Debut Date:** ${
            group.debut_date
              ? `${time(new Date(group.debut_date), 'D')} (${time(new Date(group.debut_date), 'R')})`
              : ''
          }${
            group.disband_date
              ? `\n**Disband Date:** ${time(new Date(group.disband_date), 'D')} (${time(
                  new Date(group.disband_date),
                  'R',
                )})`
              : ''
          }\n\n**Members:**\n${group.members
            .map((member) => {
              const m = idols.find((i) => i.id === member.idol_id)!;
              return `${m.name} (${m.name_original})`;
            })
            .join('\n')}`,
          thumbnail: {
            url: group.thumb_url!,
          },
          color: 0xd23b68,
        };
        return interaction.reply({ embeds: [embed] });
      }
    } catch (ex) {
      this.container.logger.error(ex);
    }
  }

  public override async autocompleteRun(interaction: AutocompleteInteraction) {
    try {
      if (interaction.commandName !== this.name) return;
      const { value } = interaction.options.getFocused(true);
      const { idols, groups } = kpop;

      const response = search(value, [...idols, ...groups], {
        keySelector: (item) => {
          if ('real_name' in item) {
            return [item.name, item.real_name, item.real_name_original, item.name_alias, item.name_original].join(' ');
          }
          return [item.name, item.name_alias, item.name_original].join(' ');
        },
        returnMatchData: true,
        limit: 5,
      })
        .map((match) => ({
          name: `${match.item.name} (${match.item.name_original}) ${
            (match.item as Idol)?.groups?.length > 0
              ? ` - ${groups.find((g) => g.id === (match.item as Idol)?.groups[0])?.name}`
              : ''
          }`,
          value: match.item.id,
        }))
        .splice(0, 5);

      await interaction.respond(response);
    } catch (ex) {
      this.container.logger.error(ex);
    }
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName('search')
        .setDescription('search for idols and idol groups')
        .addStringOption((option) =>
          option //
            .setName('query')
            .setDescription('the search query')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    );
  }
}
