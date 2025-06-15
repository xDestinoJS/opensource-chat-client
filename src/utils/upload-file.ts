export default async function uploadFile(file: File) {
	const formData = new FormData();
	formData.append("file", file);

	const response = await fetch("/api/files", {
		method: "POST",
		body: formData,
	});
	const {
		success,
		uploadUrl,
		fileId,
	}: { success: boolean; uploadUrl?: string; fileId?: string } =
		await response.json();

	if (success && uploadUrl && fileId) {
		return {
			uploadUrl,
			fileId,
		};
	} else {
		return null;
	}
}
