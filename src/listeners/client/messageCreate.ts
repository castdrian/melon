import * as path from "node:path";
import { createContext, runInContext } from "node:vm";

import { Listener } from "@sapphire/framework";
import { ChannelType, type Message, codeBlock } from "discord.js";

import {
	isInstagramAutoEmbedEnabled,
	isTikTokAutoEmbedEnabled,
	isXAutoEmbedEnabled,
} from "@root/src/database/db";
import { mappings } from "@root/src/responses.toml";
import { scrapeInstagram } from "@root/src/util/instagram";
import { scrapeTikTok } from "@root/src/util/tiktok";
import { scrapeX } from "@root/src/util/x";

export class MessageListener extends Listener {
	private static lastSakiMessage = 0;

	// URL detection regex pattern
	private urlRegex =
		/https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

	/**
	 * Checks if a matched keyword is part of a URL in the message
	 * @param content The message content
	 * @param keyword The matched keyword
	 * @returns True if the keyword is found inside a URL
	 */
	private isKeywordInUrl(content: string, keyword: string): boolean {
		const urls = content.match(this.urlRegex) || [];
		for (const url of urls) {
			// Check if the keyword is part of the URL (case insensitive)
			if (url.toLowerCase().includes(keyword.toLowerCase())) {
				return true;
			}
		}
		return false;
	}

	public async run(message: Message) {
		if (message.author.bot) return;
		if (message.channel.type === ChannelType.DM) return;
		if (message.channel.type === ChannelType.GroupDM) return;

		if (message.author.id === "904157012710015016") {
			const now = Date.now();
			const hoursSinceLastMessage =
				(now - MessageListener.lastSakiMessage) / (1000 * 60 * 60);

			if (
				hoursSinceLastMessage >= 12 ||
				MessageListener.lastSakiMessage === 0
			) {
				const __dirname = path.dirname(new URL(import.meta.url).pathname);
				const sakiPath = path.join(
					__dirname,
					"..",
					"..",
					"..",
					"media",
					"SAKI.mov",
				);

				await message.reply({ files: [sakiPath] });
				MessageListener.lastSakiMessage = now;
			}
		}

		for (const {
			keys,
			response,
			regex,
			videos = [],
			matchAll = false,
		} of mappings) {
			let matched = false;
			let matchedKeyword = "";

			if (regex && matchAll) {
				// For matchAll, all keywords must be found in the message
				matched = keys.every((keyword) => {
					const wordRegex = new RegExp(keyword, "i");
					return message.content.match(wordRegex);
				});
				if (matched) {
					if (
						keys.some((keyword) =>
							this.isKeywordInUrl(message.content, keyword),
						)
					) {
						continue;
					}
				}
			} else if (regex) {
				// Standard regex matching for individual keywords
				for (const keyword of keys) {
					const wordRegex = new RegExp(`\\b${keyword}\\b`, "i");
					const emojiRegex = new RegExp(
						`<a?:\\w*${keyword}\\w*:\\d{17,21}>`,
						"i",
					);

					if (
						message.content.match(wordRegex) ||
						message.content.match(emojiRegex)
					) {
						matchedKeyword = keyword;
						matched = true;
						break;
					}
				}

				if (matched && this.isKeywordInUrl(message.content, matchedKeyword)) {
					continue;
				}
			} else {
				for (const keyword of keys) {
					if (message.content.toLowerCase() === keyword.toLowerCase()) {
						matched = true;
						break;
					}
				}
			}

			if (matched) {
				const __dirname = path.dirname(new URL(import.meta.url).pathname);
				const files = [];

				if (videos && videos.length > 0) {
					for (let i = 0; i < Math.min(videos.length, 10); i++) {
						const videoPath = path.join(
							__dirname,
							"..",
							"..",
							"..",
							"media",
							videos[i],
						);
						files.push(videoPath);
					}
				}

				if (files.length > 0) {
					return message.channel.send({
						content: response || undefined,
						files,
					});
				}

				if (!response) return;
				return message.channel.send(response);
			}
		}

		if (message.content === message.client.user?.toString()) {
			await message
				.reply({ files: [message.client.user.displayAvatarURL({ size: 256 })] })
				.catch(() => null);
		}

		if (
			message.mentions.has(message.client.user!) &&
			message.author.id === message.client.application.owner?.id
		) {
			if (
				message.content.replace(message.client.user?.toString(), "").trim()
					.length > 0
			) {
				await message.channel.sendTyping();
				await this.runCode(message);
			}
		}

		const XId = this.extractXId(message.content);
		if (XId) {
			if (await isXAutoEmbedEnabled(message.guildId!)) {
				await message.channel.sendTyping();
				await scrapeX(XId, message);
			}
		}

		const instagramUrl = this.extractInstagramUrl(message.content);
		if (instagramUrl) {
			if (await isInstagramAutoEmbedEnabled(message.guildId!)) {
				await message.channel.sendTyping();
				await scrapeInstagram(instagramUrl, message);
			}
		}

		const tikTokUrl = this.extractTikTokUrl(message.content);
		if (tikTokUrl) {
			if (await isTikTokAutoEmbedEnabled(message.guildId!)) {
				await message.channel.sendTyping();
				await scrapeTikTok(tikTokUrl, message);
			}
		}
	}

	private extractXId(text: string): string | null {
		const regex =
			/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;
		const matches = regex.exec(text);
		return matches ? matches[1] : null;
	}

	private extractInstagramUrl(text: string): string | null {
		const regex =
			/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([^/?#&]+)/;
		const matches = regex.exec(text);
		return matches ? matches[0] : null;
	}

	private extractTikTokUrl(text: string): string | null {
		const tikTokRegex =
			/^.*https:\/\/(?:m|www|vm)?\.?tiktok\.com\/((?:.*\b(?:(?:usr|v|embed|user|video)\/|\?shareId=|\&item_id=)(\d+))|\w+)/;
		const matches = tikTokRegex.exec(text);
		return matches ? matches[0] : null;
	}

	private async runCode(message: Message) {
		const code = message.content
			.replace(message.client.user.toString(), "")
			.trim();
		try {
			const result = runInContext(code, createContext({ message }), {
				timeout: 30000,
			});
			await message.reply(codeBlock("ts", result));
		} catch (error) {
			await message.reply(`An error occurred: ${error}`);
		}
	}
}
