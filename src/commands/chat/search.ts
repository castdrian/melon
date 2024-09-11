import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, type AutocompleteInteraction, type CommandInteraction, InteractionContextType, strikethrough, time } from 'discord.js';
import { search } from 'fast-fuzzy';
import { getKoreanRegex } from 'ko-fuzzy';
import kpop, { type Idol } from 'kpopnet.json';

import { MELON_COLOR } from '@root/src/config';

export class SearchCommand extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		try {
			if (!interaction.isChatInputCommand()) return;
			const value = interaction.options.getString('query', true);

			const { idols, groups } = kpop;

			const idol = idols.find((i) => i.id === value);
			const group = groups.find((g) => g.id === value);

			if (!idol && !group) {
				return interaction.reply('Could not find an idol or group with that ID.');
			}

			if (idol) {
				const embed = {
					title: `${idol.name_original} (${idol.name})`,
					description: `**Real Name:** ${idol.real_name ? `${idol.real_name_original} (${idol.real_name})\n` : ''
						}**Born:** ${time(new Date(idol.birth_date), 'D')} (${time(
							new Date(idol.birth_date),
							'R',
						)})\n**Debuted:** ${idol.debut_date ? `${time(new Date(idol.debut_date), 'D')} (${time(new Date(idol.debut_date), 'R')})` : ''
						}${idol.height ? `\n**Height:** ${idol.height} CM` : ''}${idol.weight ? `\n**Weight:** ${idol.weight} KG` : ''
						}${idol.groups.length > 0
							? `\n**Groups:** ${idol.groups
								.map((id) => {
									const g = groups.find((grp) => grp.id === id)!;
									return g.members.some((member) => member.idol_id === idol.id && member.current)
										? g.name
										: strikethrough(g.name);
								})
								.join(' ')}`
							: ''
						}`,
					thumbnail: {
						url: idol.thumb_url!,
					},
					color: MELON_COLOR,
				};
				return interaction.reply({ embeds: [embed] });
			}

			if (group) {
				const embed = {
					title: `${group.name_original} (${group.name})`,
					description: `**Agency:** ${group.agency_name}\n**Debut Date:** ${group.debut_date
						? `${time(new Date(group.debut_date), 'D')} (${time(new Date(group.debut_date), 'R')})`
						: ''
						}${group.disband_date
							? `\n**Disband Date:** ${time(new Date(group.disband_date), 'D')} (${time(
								new Date(group.disband_date),
								'R',
							)})`
							: ''
						}\n**Members:**\n${group.members
							.map((member) => {
								const m = idols.find((i) => i.id === member.idol_id)!;
								const memberName = member.current
									? `${m.name_original} (${m.name})`
									: strikethrough(`${m.name_original} (${m.name})`);
								return memberName;
							})
							.join('\n')}`,
					thumbnail: {
						url: group.thumb_url!,
					},
					color: MELON_COLOR,
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

			const isKorean = /[\u1100-\u11FF\uAC00-\uD7AF\uA960-\uA97F\uD7B0-\uD7FF]/.test(value);
			let matches = [];

			if (isKorean) {
				const regex = getKoreanRegex(value, { consonantMatch: true, fuzzy: true });
				matches = [...idols, ...groups].filter((item) => {
					if ('real_name' in item) {
						return (
							(item.name && regex.test(item.name)) ||
							(item.real_name && regex.test(item.real_name)) ||
							(item.name_alias && regex.test(item.name_alias)) ||
							(item.name_original && regex.test(item.name_original)) ||
							(item.real_name_original && regex.test(item.real_name_original))
						);
					}
					return (
						(item.name && regex.test(item.name)) ||
						(item.name_alias && regex.test(item.name_alias)) ||
						(item.name_original && regex.test(item.name_original))
					);
				});
			} else {
				matches = search(value, [...idols, ...groups], {
					keySelector: (item) => {
						if ('real_name' in item) {
							return [item.name, item.real_name, item.real_name_original, item.name_alias, item.name_original].join(
								' ',
							);
						}
						return [item.name, item.name_alias, item.name_original].join(' ');
					},
					returnMatchData: true,
					limit: 5,
				}).map((match) => match.item);
			}

			const response = matches.slice(0, 5).map((item) => {
				const idol = item as Idol;
				const group = groups.find((g) => g.members.some((member) => member.idol_id === idol.id && member.current));
				return {
					name: `${idol.name} (${idol.name_original}) ${group ? `- ${group.name}` : ''}`,
					value: idol.id,
				};
			});

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
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
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
