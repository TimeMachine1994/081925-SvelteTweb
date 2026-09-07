export function slugify(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
}

export function parseTags(raw: string | null): string[] {
	return raw
		? raw
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean)
		: [];
}
