import { MELON_COLOR, config } from "@src/config";
import {
	ContainerBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	type Message,
	MessageFlags,
	SectionBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
	time,
} from "discord.js";

interface InstagramPostResponse {
	data: {
		xdt_api__v1__media__shortcode__web_info: {
			items: InstagramPost[];
		};
	};
}

interface InstagramError {
	message: string;
	type: string;
	code: number;
}

interface InstagramPost {
	code: string;
	taken_at: number;
	video_versions?: VideoVersion[];
	image_versions2?: {
		candidates: ImageVersion[];
	};
	carousel_media?: CarouselMedia[];
	user: InstagramUser;
	caption?: {
		text: string;
		created_at: number;
	};
}

interface VideoVersion {
	width: number;
	height: number;
	url: string;
	type: number;
}

interface ImageVersion {
	url: string;
	width: number;
	height: number;
}

interface CarouselMedia {
	video_versions?: VideoVersion[];
	image_versions2?: {
		candidates: ImageVersion[];
	};
}

interface InstagramUser {
	pk: string;
	username: string;
	full_name: string;
	profile_pic_url: string;
	is_verified: boolean;
}

async function fetchInstagramPost(
	shortcode: string,
): Promise<InstagramPostResponse> {
	const url = `https://instagram230.p.rapidapi.com/post/details?shortcode=${shortcode}`;
	const response = await fetch(url, {
		headers: {
			"x-rapidapi-key": config.instagramApiToken,
			"x-rapidapi-host": "instagram230.p.rapidapi.com",
		},
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(
			`API Error: ${response.status} - ${data.message || "Unknown error"}`,
		);
	}

	if (data.errors) {
		const errors = Array.isArray(data.errors) ? data.errors : [data.errors];
		throw new Error(
			`API returned errors: ${errors
				.map((e: InstagramError) => e.message)
				.join(", ")}`,
		);
	}

	if (!data.data?.xdt_api__v1__media__shortcode__web_info?.items?.[0]) {
		throw new Error("Post not found or API response was invalid");
	}

	return data;
}

export async function scrapeInstagram(instagramURL: string, message: Message) {
	try {
		// Extract shortcode from URL (supporting both /p/ and /reel/)
		const shortcode = instagramURL.split(/\/(p|reel)\/([^/?]+)/)[2];
		if (!shortcode) throw new Error("Invalid Instagram URL");

		const data = await fetchInstagramPost(shortcode);
		const post = data.data.xdt_api__v1__media__shortcode__web_info.items[0];
		if (!post) throw new Error("Post not found");

		// Create components
		const container = new ContainerBuilder().setAccentColor(MELON_COLOR);

		const headerContent = new TextDisplayBuilder().setContent(
			`Posted ${time(post.taken_at, "R")} by [**@${post.user.username}**](<https://instagram.com/${post.user.username}>)${
				post.caption ? `\n\n${post.caption.text}` : ""
			}`,
		);

		const headerSection = new SectionBuilder()
			.addTextDisplayComponents(headerContent)
			.setThumbnailAccessory(
				new ThumbnailBuilder().setURL(post.user.profile_pic_url),
			);

		container.addSectionComponents(headerSection);

		// Media galleries
		if (post.carousel_media?.length) {
			const firstGallery = new MediaGalleryBuilder();
			const secondGallery = new MediaGalleryBuilder();

			post.carousel_media.forEach((item, index) => {
				const mediaItem = new MediaGalleryItemBuilder();

				if (item.video_versions?.[0]) {
					mediaItem.setURL(item.video_versions[0].url);
				} else if (item.image_versions2?.candidates?.[0]) {
					mediaItem.setURL(item.image_versions2.candidates[0].url);
				}

				if (index < 10) {
					firstGallery.addItems(mediaItem);
				} else if (index < 20) {
					secondGallery.addItems(mediaItem);
				}
			});

			if (firstGallery.items.length) {
				container.addMediaGalleryComponents(firstGallery);
			}
			if (secondGallery.items.length) {
				container.addMediaGalleryComponents(secondGallery);
			}
		} else {
			// Single media post
			const gallery = new MediaGalleryBuilder();
			const mediaItem = new MediaGalleryItemBuilder();

			if (post.video_versions?.[0]) {
				mediaItem.setURL(post.video_versions[0].url);
				gallery.addItems(mediaItem);
			} else if (post.image_versions2?.candidates?.[0]) {
				mediaItem.setURL(post.image_versions2.candidates[0].url);
				gallery.addItems(mediaItem);
			}

			if (gallery.items.length) {
				container.addMediaGalleryComponents(gallery);
			}
		}

		await message.suppressEmbeds(true);
		await message.reply({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		await message.reply(`Failed to fetch Instagram post: ${errorMessage}`);
		message.client.logger.error("Instagram scraping error:", error);
	}
}
