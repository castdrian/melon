import { scrapeInstagram } from "@root/src/util/instagram";
import { Command } from "@sapphire/framework";
import {
	ApplicationIntegrationType,
	type CommandInteraction,
	MessageFlags,
} from "discord.js";

export class InstagramCommand extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		try {
			if (!interaction.isChatInputCommand()) return;
			await interaction.deferReply();
			const value = interaction.options.getString("url", true);
			const container = await scrapeInstagram(value);
			if (!container) throw new Error("Received no data");

			await interaction.editReply({
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			interaction.client.logger.error(error);
			return interaction.editReply({
				content: "An error occurred while processing your request.",
			});
		}
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName("instagram")
				.setDescription("embeds an Instagram post")
				.setIntegrationTypes([
					ApplicationIntegrationType.GuildInstall,
					ApplicationIntegrationType.UserInstall,
				])
				.addStringOption((option) =>
					option //
						.setName("url")
						.setDescription("the Instagram post URL")
						.setRequired(true),
				),
		);
	}
}
