import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_SERVER_URL: {
		public: true,
		static: true,
		schema: (value) => {
			if (!value?.trim()) {
				throw new Error('PUBLIC_SERVER_URL must be configured.');
			}

			return new URL(value).toString().replace(/\/+$/, '');
		}
	}
});
