import superjson from "@squaredmade/superjson";

export const parseSuperJSON = (value: string) => {
	try {
		return superjson.parse(value);
	} catch {
		return value;
	}
};
