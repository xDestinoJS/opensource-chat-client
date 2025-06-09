export default function copyToClipboard(text: string) {
	if (navigator.clipboard && window.isSecureContext) {
		return navigator.clipboard.writeText(text);
	}
}
