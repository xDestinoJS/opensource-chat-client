export default function stripMarkdownFromString(input?: string): string {
	if (!input) return "";
	const markdownRegex =
		/(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|`([^`]+)`|~~(.*?)~~|\*|#|\n/g;
	return input
		.replace(markdownRegex, (match, p1, p2, p3, p4, p5, p6) => {
			if (p1 || p3) return p2 || p4; // Bold or italic
			if (p5) return p5; // Inline code
			if (p6) return ""; // Strikethrough
			return ""; // Remove asterisk
		})
		.trim();
}
