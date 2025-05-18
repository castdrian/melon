import { type Group, type Idol, getItemById, search } from "@castdrian/kdapi";
import { Command } from "@sapphire/framework";
import {
	ApplicationIntegrationType,
	type AutocompleteInteraction,
	type CommandInteraction,
	ContainerBuilder,
	InteractionContextType,
	MessageFlags,
	SectionBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
	time,
} from "discord.js";

import { CHEEKIES_COLOR } from "@root/src/config";

interface SocialLinks {
	instagram?: string;
	twitter?: string;
	youtube?: string;
	spotify?: string;
	facebook?: string;
	tiktok?: string;
	website?: string;
	fancafe?: string;
	weibo?: string;
	vlive?: string;
}

interface CompanyHistory {
	name: string;
	period: {
		start: string;
		end?: string;
	};
}

interface Member {
	name: string;
	period?: {
		start: string;
		end?: string;
	};
}

interface MemberHistory {
	currentMembers?: Member[];
	formerMembers?: Member[];
}

export class SearchCommand extends Command {
	private formatStatus(status: string): string {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	private formatGroupType(type: string): string {
		return `${type.charAt(0).toUpperCase()}${type.slice(1)} Group`;
	}

	private formatSocialLinks(socials: SocialLinks): string {
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
		history: CompanyHistory[];
	}): string {
		if (!company?.history?.length) return "";
		return company.history
			.map(
				(h) =>
					`• ${h.name} (${time(new Date(h.period.start), "D")}${h.period.end ? ` - ${time(new Date(h.period.end), "D")}` : " - Present"})`,
			)
			.join("\n");
	}

	private formatMembers(memberHistory?: MemberHistory): string {
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
				return `• ${name}${periodStr}`;
			})
			.filter((item, index, self) => self.indexOf(item) === index)
			.join("\n");

		return memberList.length ? `\n\n**Members**\n${memberList}` : "";
	}

	public override async chatInputRun(interaction: CommandInteraction) {
		try {
			if (!interaction.isChatInputCommand()) return;
			const value = interaction.options.getString("query", true);

			const item = getItemById(value);
			if (!item) {
				return interaction.reply({
					content: "Could not find an idol or group with that ID.",
					flags: MessageFlags.Ephemeral,
				});
			}

			const container = new ContainerBuilder().setAccentColor(CHEEKIES_COLOR);

			// Type check based on properties unique to idols
			if ("names" in item && "stage" in item.names) {
				const idol = item as Idol;

				const headerInfo = [
					`# ${idol.names.korean ?? ""} (${idol.names.stage})`,
					`**Status:** ${this.formatStatus(idol.status)}`,
					idol.debutDate
						? `**Debut:** ${time(new Date(idol.debutDate), "D")} (${time(new Date(idol.debutDate), "R")})`
						: null,
					idol.names.full ? `**Full Name:** ${idol.names.full}` : null,
					idol.names.native ? `**Native Name:** ${idol.names.native}` : null,
					idol.names.japanese
						? `**Japanese Name:** ${idol.names.japanese}`
						: null,
					idol.names.chinese ? `**Chinese Name:** ${idol.names.chinese}` : null,
					idol.company?.current ? `**Company:** ${idol.company.current}` : null,
					idol.country
						? `**Nationality:** :flag_${idol.country.code}: ${idol.country.name}`
						: null,
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
					idol.description ? `**Description**\n-# ${idol.description}` : null,
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
											end?: string | number | Date;
										};
										status: string;
										name: string;
										company?: string;
									}) => {
										if (!g.period)
											return `• ${g.status === "current" ? g.name : `~~${g.name}~~`}`;

										const startDate = new Date(g.period.start);
										const endDate = g.period.end
											? new Date(g.period.end)
											: null;

										const periodStr = `${time(startDate, "D")} (${time(startDate, "R")})${
											endDate
												? ` - ${time(endDate, "D")} (${time(endDate, "R")})`
												: " - Present"
										}`;

										const companyActivity = idol.careerInfo?.activeYears?.find(
											(period: { start: string | number | Date }) =>
												g.company &&
												idol.company?.history?.some(
													(h: {
														name: string | undefined;
														period: { start: string | number | Date };
													}) =>
														h.name === g.company &&
														new Date(h.period.start).getTime() ===
															new Date(period.start).getTime(),
												),
										);

										const companyStr = companyActivity
											? ` [${time(new Date(companyActivity.start), "D")} (${time(new Date(companyActivity.start), "R")})]`
											: "";

										return `• ${g.status === "current" ? g.name : `~~${g.name}~~`} (${periodStr})${companyStr}`;
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
				const group = item as Group;
				const name = group.name ?? group.groupInfo?.names?.stage ?? "Unknown";
				const korean = group.groupInfo?.names?.korean;

				const headerInfo = [
					`# ${korean ? `${korean} ` : ""}(${name})`,
					`**Type:** ${this.formatGroupType(group.type ?? "unknown")}`,
					`**Status:** ${this.formatStatus(group.status ?? "unknown")}`,
					group.debutDate
						? `**Debut:** ${time(new Date(group.debutDate), "D")} (${time(new Date(group.debutDate), "R")})`
						: null,
					group.groupInfo?.names?.japanese
						? `**Japanese Name:** ${group.groupInfo.names.japanese}`
						: null,
					group.groupInfo?.names?.chinese
						? `**Chinese Name:** ${group.groupInfo.names.chinese}`
						: null,
					group.company?.current
						? `**Company:** ${group.company.current}`
						: null,
					group.groupInfo?.fandomName
						? `**Fandom Name:** ${group.groupInfo.fandomName}`
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
			await interaction.reply({
				content: "An error occurred while processing your request.",
				flags: MessageFlags.Ephemeral,
			});
		}
	}

	public override async autocompleteRun(interaction: AutocompleteInteraction) {
		try {
			if (interaction.commandName !== this.name) return;
			const { value } = interaction.options.getFocused(true);

			const results = search(value, {
				type: "all",
				limit: 10,
				threshold: 0.4,
			});

			if (!results?.length) {
				return interaction.respond([]);
			}

			const response = results
				.map((result: { type: string; item: Idol | Group }) => {
					try {
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
							name: `${group.groupInfo?.names?.korean ? `${group.groupInfo.names.korean} ` : ""}(${group.groupInfo?.names?.stage ?? "Unknown"})`,
							value: group.id,
						};
					} catch (err) {
						console.error("Error processing result:", err);
						return null;
					}
				})
				.filter(
					(
						item: { name: string; value: string } | null,
					): item is {
						name: string;
						value: string;
					} => Boolean(item?.name && item?.value),
				)
				.slice(0, 10);

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
				.setContexts([
					InteractionContextType.Guild,
					InteractionContextType.BotDM,
					InteractionContextType.PrivateChannel,
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
