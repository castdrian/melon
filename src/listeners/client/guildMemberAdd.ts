import { Listener } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';

import { MELON_COLOR } from '@root/src/config';
import { getOrCreateGreetingSettings, isGreetingEnabled } from '@root/src/database/db';

export class GuildMemberListener extends Listener {
	public async run(member: GuildMember) {
		if (!(await isGreetingEnabled(member.guild.id))) return;
		const { greetingChannelId, greetingMessageContent, greetingEmbedTitle, greetingEmbedDescription } =
			await getOrCreateGreetingSettings(member.guild.id);

		const channel = member.guild.channels.cache.get(greetingChannelId!);
		if (!channel?.isTextBased()) return;

		const content = greetingMessageContent?.replace(/{{member}}/g, member.toString());
		const title = greetingEmbedTitle?.replace(/{{guild}}/g, member.guild.toString());

		const embed =
			greetingEmbedTitle && greetingEmbedDescription
				? {
					title,
					description: greetingEmbedDescription,
					thumbnail: {
						url: member.user.displayAvatarURL(),
					},
					color: MELON_COLOR,
				}
				: null;

		await channel.send({ content, embeds: embed ? [embed] : undefined }).catch(() => null);
	}
}
