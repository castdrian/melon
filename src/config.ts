import { createConfigLoader } from 'neat-config';
import { z } from 'zod';

const schema = z.object({
  discordToken: z.string().min(1),
  devGuildId: z.string().optional(),
  instagramUsername: z.string().min(1),
  instagramPassword: z.string().min(1),
});

const prefix = 'CONF_';

export const config = createConfigLoader()
  .addFromFile('.env', { prefix })
  .addFromEnvironment(prefix)
  .addZodSchema(schema)
  .load();

export const MELON_COLOR = 0xd23b68;
