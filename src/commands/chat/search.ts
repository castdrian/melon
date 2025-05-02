import {
	type Group,
	type Idol,
	fuzzySearch,
	getItemById,
} from "@castdrian/kdapi";
import { Command } from "@sapphire/framework";
import {
	ApplicationIntegrationType,
	type AutocompleteInteraction,
	type CommandInteraction,
	ContainerBuilder,
	MessageFlags,
	SectionBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
	time,
} from "discord.js";

import { MELON_COLOR } from "@root/src/config";

export class SearchCommand extends Command {
	private formatStatus(status: string): string {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	private formatGroupType(type: string): string {
		return `${type.charAt(0).toUpperCase()}${type.slice(1)} Group`;
	}

	private formatSocialLinks(socials: {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		instagram: any;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		twitter: any;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		youtube: any;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		spotify: any;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		facebook: any;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		tiktok: any;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		website: any;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		fancafe: any;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		weibo: any;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		vlive: any;
	}): string {
		if (!socials) return "";
		const links = [];
		if (socials.instagram) links.push(`[Instagram](${socials.instagram})`);
		if (socials.twitter) links.push(`[Twitter](${socials.twitter})`);
		if (socials.youtube) links.push(`[YouTube](${socials.youtube})`);
		if (socials.spotify) links.push(`[Spotify](${socials.spotify})`);
		if (socials.facebook) links.push(`[Facebook](${socials.facebook})`);
		if (socials.tiktok) links.push(`[TikTok](${socials.tiktok})`);
		if (socials.website) links.push(`[Website](${socials.website})`);
		if (socials.fancafe) links.push(`[Fancafe](${socials.fancafe})`);
		if (socials.weibo) links.push(`[Weibo](${socials.weibo})`);
		if (socials.vlive) links.push(`[VLive](${socials.vlive})`);
		return links.length ? `\n\n**Social Media**\n${links.join(" • ")}` : "";
	}

	private formatCompanyHistory(company: {
		history: {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			name: any;
			period: { start: string | number | Date; end: string | number | Date };
		}[];
	}): string {
		if (!company?.history?.length) return "";
		return company.history
			.map(
				(h: {
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					name: any;
					period: {
						start: string | number | Date;
						end: string | number | Date;
					};
				}) =>
					`• ${h.name} (${time(new Date(h.period.start), "D")}${h.period.end ? ` - ${time(new Date(h.period.end), "D")}` : " - Present"})`,
			)
			.join("\n");
	}

	private formatMembers(memberHistory?: {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		currentMembers?: any[];
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		formerMembers?: any[];
	}): string {
		if (!memberHistory?.currentMembers && !memberHistory?.formerMembers)
			return "";

		const formerMemberNames = new Set(
			memberHistory.formerMembers?.map((m) => m.name) ?? [],
		);
		const allMembers = [
			...(memberHistory.currentMembers ?? []),
			...(memberHistory.formerMembers ?? []),
		];

		if (!allMembers.length) return "";

		const memberList = allMembers
			.map((m) => {
				const isCurrent = !formerMemberNames.has(m.name);
				const periodStr = m.period
					? ` (${time(new Date(m.period.start), "D")}${m.period.end ? ` - ${time(new Date(m.period.end), "D")}` : " - Present"})`
					: "";
				const name = isCurrent ? m.name : `~~${m.name}~~`;
				return `• ${name}${m.position?.length ? ` [${m.position.join(", ")}]` : ""}${periodStr}`;
			})
			// Remove duplicates based on the full formatted string
			.filter((item, index, self) => self.indexOf(item) === index)
			.join("\n");

		return memberList.length ? `\n\n**Members**\n${memberList}` : "";
	}

	public override async chatInputRun(interaction: CommandInteraction) {
		try {
			if (!interaction.isChatInputCommand()) return;
			const value = interaction.options.getString("query", true);

			const result = getItemById(value);
			if (!result) {
				return interaction.reply(
					"Could not find an idol or group with that ID.",
				);
			}

			const container = new ContainerBuilder().setAccentColor(MELON_COLOR);

			if (result.type === "idol") {
				const idol = result.item as Idol;

				const headerInfo = [
					`# ${idol.names.korean ?? ""} (${idol.names.stage})`,
					`**Status:** ${this.formatStatus(idol.status)}`,
					idol.names.japanese
						? `**Japanese Name:** ${idol.names.japanese}`
						: null,
					idol.names.chinese ? `**Chinese Name:** ${idol.names.chinese}` : null,
					idol.company?.current ? `**Company:** ${idol.company.current}` : null,
				]
					.filter(Boolean)
					.join("\n");

				const personalInfo = [
					"**Personal Information**",
					idol.physicalInfo?.birthDate
						? `• Born: ${time(new Date(idol.physicalInfo.birthDate), "D")} (${time(new Date(idol.physicalInfo.birthDate), "R")})`
						: null,
					idol.physicalInfo?.zodiacSign
						? `• Zodiac: ${idol.physicalInfo.zodiacSign}`
						: null,
					idol.physicalInfo?.height
						? `• Height: ${idol.physicalInfo.height} cm`
						: null,
					idol.physicalInfo?.weight
						? `• Weight: ${idol.physicalInfo.weight} kg`
						: null,
					idol.physicalInfo?.bloodType
						? `• Blood Type: ${idol.physicalInfo.bloodType}`
						: null,
					idol.personalInfo?.mbti ? `• MBTI: ${idol.personalInfo.mbti}` : null,
				]
					.filter(Boolean)
					.join("\n");

				const sections = [
					headerInfo,
					personalInfo,
					idol.company?.history?.length
						? `**Company History**\n${this.formatCompanyHistory(idol.company)}`
						: null,
					idol.careerInfo?.debutDate || idol.careerInfo?.activeYears?.length
						? `**Career Information**\n${idol.careerInfo.debutDate ? `• Debut: ${time(new Date(idol.careerInfo.debutDate), "D")}\n` : ""}${
								idol.careerInfo.activeYears
									?.map(
										(period: {
											start: string | number | Date;
											end: string | number | Date;
										}) =>
											`• Active: ${time(new Date(period.start), "D")}${period.end ? ` - ${time(new Date(period.end), "D")}` : " - Present"}`,
									)
									.join("\n") ?? ""
							}`
						: null,
					idol.groups?.length
						? `**Group History**\n${idol.groups
								.map(
									(g: {
										period: {
											start: string | number | Date;
											end: string | number | Date;
										};
										status: string;
										// biome-ignore lint/suspicious/noExplicitAny: <explanation>
										name: any;
									}) => {
										const periodStr = g.period
											? ` (${time(new Date(g.period.start), "D")}${g.period.end ? ` - ${time(new Date(g.period.end), "D")}` : " - Present"})`
											: "";
										return `• ${g.status === "current" ? g.name : `~~${g.name}~~`}${periodStr}`;
									},
								)
								.join("\n")}`
						: null,
				]
					.filter(Boolean)
					.join("\n\n");

				const content = new TextDisplayBuilder().setContent(
					sections + this.formatSocialLinks(idol.socialMedia),
				);

				const section = new SectionBuilder()
					.addTextDisplayComponents(content)
					.setThumbnailAccessory(
						new ThumbnailBuilder().setURL(idol.imageUrl ?? ""),
					);

				container.addSectionComponents(section);
			} else {
				const group = result.item as Group;

				const headerInfo = [
					`# ${group.names.korean ?? ""} (${group.names.stage})`,
					`**Type:** ${this.formatGroupType(group.type)}`,
					`**Status:** ${this.formatStatus(group.status)}`,
					group.names.japanese
						? `**Japanese Name:** ${group.names.japanese}`
						: null,
					group.names.chinese
						? `**Chinese Name:** ${group.names.chinese}`
						: null,
					group.company?.current
						? `**Company:** ${group.company.current}`
						: null,
				]
					.filter(Boolean)
					.join("\n");

				const sections = [
					headerInfo,
					group.company?.history?.length
						? `**Company History**\n${this.formatCompanyHistory(group.company)}`
						: null,
					group.groupInfo?.debutDate || group.groupInfo?.disbandmentDate
						? `**Group Information**\n${[
								group.groupInfo?.debutDate
									? `• Debut: ${time(new Date(group.groupInfo.debutDate), "D")}`
									: null,
								group.groupInfo?.disbandmentDate
									? `• Disbanded: ${time(new Date(group.groupInfo.disbandmentDate), "D")}`
									: null,
							]
								.filter(Boolean)
								.join("\n")}`
						: null,
				]
					.filter(Boolean)
					.join("\n\n");

				const content = new TextDisplayBuilder().setContent(
					sections +
						(group.memberHistory
							? this.formatMembers(group.memberHistory)
							: "") +
						this.formatSocialLinks(group.socialMedia),
				);

				const section = new SectionBuilder()
					.addTextDisplayComponents(content)
					.setThumbnailAccessory(
						new ThumbnailBuilder().setURL(group.imageUrl ?? ""),
					);

				container.addSectionComponents(section);
			}

			await interaction.reply({
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (ex) {
			this.container.logger.error(ex);
		}
	}

	public override async autocompleteRun(interaction: AutocompleteInteraction) {
		try {
			if (interaction.commandName !== this.name) return;
			const { value } = interaction.options.getFocused(true);

			const results = fuzzySearch(value, {
				type: "all",
				limit: 5,
				threshold: 0.4,
			});

			if (!results?.length) {
				return interaction.respond([]);
			}

			const response = results
				.map((result) => {
					if (result.type === "idol") {
						const idol = result.item as Idol;
						const currentGroup = idol.groups?.find(
							(g: { status: string }) => g?.status === "current",
						);
						return {
							name: `${idol.names.korean ? `${idol.names.korean} ` : ""}(${idol.names.stage})${currentGroup?.name ? ` - ${currentGroup.name}` : ""}`,
							value: idol.id,
						};
					}
					const group = result.item as Group;
					return {
						name: `${group.names.korean ? `${group.names.korean} ` : ""}(${group.names.stage})`,
						value: group.id,
					};
				})
				.filter((item) => item.name && item.value)
				.slice(0, 5);

			await interaction.respond(response);
		} catch (ex) {
			this.container.logger.error(ex);
			await interaction.respond([]);
		}
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName("search")
				.setDescription("search for idols and idol groups")
				.setIntegrationTypes([
					ApplicationIntegrationType.GuildInstall,
					ApplicationIntegrationType.UserInstall,
				])
				.addStringOption((option) =>
					option //
						.setName("query")
						.setDescription("the search query")
						.setRequired(true)
						.setAutocomplete(true),
				),
		);
	}
}
