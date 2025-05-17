declare module "*.toml" {
	/**
	 * Interface representing the structure of a mapping item
	 */
	interface Mapping {
		/** Array of trigger keywords */
		keys: string[];
		/** Response text to send (optional if videos are provided) */
		response?: string;
		/** Whether to use regex matching for the keywords */
		regex: boolean;
		/** Optional array of video filenames to send with the response (max 10) */
		videos?: string[];
		/** Optional flag to require all keys to be present in the message (for regex matches) */
		matchAll?: boolean;
	}

	/**
	 * Interface representing the structure of the responses.toml file
	 */
	interface Responses {
		/** Array of response mappings */
		mappings: Mapping[];
	}

	const content: Responses;
	export = content;
	export const mappings: Mapping[];
}
