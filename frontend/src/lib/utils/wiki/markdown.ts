import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Configure marked with custom settings
 */
marked.setOptions({
	gfm: true, // GitHub Flavored Markdown
	breaks: true, // Convert \n to <br>
	headerIds: true, // Add IDs to headers
	mangle: false // Don't escape autolinked email
});

/**
 * Parse markdown to HTML with sanitization
 */
export function parseMarkdown(content: string): string {
	const html = marked.parse(content);
	return DOMPurify.sanitize(html as string, {
		ADD_ATTR: ['target'] // Allow target="_blank" for external links
	});
}

/**
 * Extract plain text excerpt from markdown
 */
export function extractExcerpt(markdown: string, maxLength: number = 200): string {
	// Remove markdown syntax
	const plainText = markdown
		.replace(/#{1,6}\s+/g, '') // Headers
		.replace(/\*\*(.+?)\*\*/g, '$1') // Bold
		.replace(/\*(.+?)\*/g, '$1') // Italic
		.replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
		.replace(/`(.+?)`/g, '$1') // Code
		.replace(/\[\[(.+?)(?:\|.+?)?\]\]/g, '$1') // Wiki links
		.trim();

	if (plainText.length <= maxLength) return plainText;

	return plainText.substring(0, maxLength).trim() + '...';
}

/**
 * Estimate reading time in minutes
 */
export function estimateReadingTime(markdown: string): number {
	const wordsPerMinute = 200;
	const words = markdown.trim().split(/\s+/).length;
	return Math.ceil(words / wordsPerMinute);
}
