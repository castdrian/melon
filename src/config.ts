import { createConfig, loaders } from "@neato/config";
import { z } from "zod";

const schema = z.object({
	discordToken: z.string().min(1),
	devGuildId: z.string().optional(),
	instagramApiToken: z.string().min(1),
});

export const config = createConfig({
	schema,
	envPrefix: "CONF_",
	loaders: [loaders.file(".env"), loaders.environment()],
	freeze: true,
});

export const MELON_COLOR = 0xd23b68;
