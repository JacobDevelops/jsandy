export function slugify(text: string) {
	const slug = text
		.toString()
		.toLowerCase()
		.normalize("NFD")
		.trim()
		.replace(/\./g, "")
		.replace(/\s+/g, "-")
		.replace(/[^\w-]+/g, "")
		.replace(/--+/g, "-");

	// Handle edge case where slug becomes empty or just hyphens
	return slug.replace(/^-+|-+$/g, "") || "untitled";
}
