import { Listener } from '@sapphire/framework';
import { GuildMember } from 'discord.js';

export class GuildMemberListener extends Listener {
  public async run(member: GuildMember) {}
}
