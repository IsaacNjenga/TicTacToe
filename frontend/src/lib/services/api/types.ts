export interface ServiceContext {
	cookies: {
		get: (name: string) => string | undefined;
	};
	locals?: App.Locals;
}
