import { createContext, runInContext } from 'node:vm';

import { Listener } from '@sapphire/framework';
import { ChannelType, Message, codeBlock } from 'discord.js';

import { isInstagramAutoEmbedEnabled, isTikTokAutoEmbedEnabled, isXAutoEmbedEnabled } from '@root/src/database/db';
import { scrapeInstagram } from '@root/src/util/instagram';
import { scrapeTikTok } from '@root/src/util/tiktok';
import { scrapeX } from '@root/src/util/x';

export class MessageListener extends Listener {
  public async run(message: Message) {
    if (message.author.bot) return;
    if (message.channel.type === ChannelType.DM) return;

    if (message.content === '<a:aryejihug2:813322436803690507>') {
      await message.channel.send('<a:aryejihug2:1201800490602745866>');
    }

    if (message.content.match(/^(who|whom|whomst)$/) || message.content.match(/<a?:who:\d{17,21}>/)) {
      await message.channel.send('<:who:1201796740085190706>');
    }

    if (message.content === message.client.user?.toString()) {
      await message.reply({ files: [message.client.user.displayAvatarURL({ size: 256 })] }).catch(() => null);
    }

    if (message.mentions.has(message.client.user!) && message.author.id === message.client.application.owner?.id) {
      if (message.content.replace(message.client.user?.toString(), '').trim().length > 0) {
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
    const regex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;
    const matches = regex.exec(text);
    return matches ? matches[1] : null;
  }

  private extractInstagramUrl(text: string): string | null {
    const regex = /((?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([^/?#&]+)).*/g;
    const matches = regex.exec(text);
    return matches ? matches[1] : null;
  }

  private extractTikTokUrl(text: string): string | null {
    const tikTokRegex =
      /^.*https:\/\/(?:m|www|vm)?\.?tiktok\.com\/((?:.*\b(?:(?:usr|v|embed|user|video)\/|\?shareId=|\&item_id=)(\d+))|\w+)/;
    const matches = tikTokRegex.exec(text);
    return matches ? matches[0] : null;
  }

  private async runCode(message: Message) {
    const code = message.content.replace(message.client.user.toString(), '').trim();
    try {
      const result = runInContext(code, createContext({ message }), { timeout: 30000 });
      await message.reply(codeBlock('ts', result));
    } catch (error) {
      await message.reply(`An error occurred: ${error}`);
    }
  }
}
