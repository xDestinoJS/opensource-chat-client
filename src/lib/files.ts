"server only";

import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const s3Client = new S3Client({
	region: "auto",
	endpoint: process.env.AWS_ENDPOINT_URL_S3!,
	forcePathStyle: false,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

export type GenericFileData = {
	name: string;
	fileId: string;
	uploadUrl: string;
	mimeType?: string;
};

export type UploadItem = GenericFileData & { isUploaded?: boolean };

export async function uploadFileToBucket(file: File, filename: string) {
	const Key = filename;
	const Bucket = process.env.AWS_BUCKET_NAME as string;

	let res;

	try {
		const parallelUploads = new Upload({
			client: s3Client,
			params: {
				Bucket,
				Key,
				Body: file.stream(),
				ACL: "public-read",
				ContentType: file.type,
			},
			queueSize: 4,
			leavePartsOnError: false,
		});

		res = await parallelUploads.done();
	} catch (error) {
		console.log(error);
		throw error;
	}

	return res;
}

export async function uploadUint8ArrayToBucket(
	data: Uint8Array,
	filename: string,
	mimeType: string
) {
	const Bucket = process.env.AWS_BUCKET_NAME as string;
	const Key = filename;

	try {
		const parallelUploads = new Upload({
			client: s3Client,
			params: {
				Bucket,
				Key,
				Body: data,
				ACL: "public-read", // change if needed
				ContentType: mimeType,
			},
			queueSize: 4,
			leavePartsOnError: false,
		});

		const res = await parallelUploads.done();
		return res; // returns upload metadata
	} catch (error) {
		console.error("Upload failed:", error);
		throw error;
	}
}

export async function getFileById(
	fileId: string
): Promise<{ location: string; mimeType: string } | null> {
	const Bucket = process.env.AWS_BUCKET_NAME as string;
	const Key = fileId;

	try {
		// Check if the object exists and get metadata
		const headCommand = new HeadObjectCommand({ Bucket, Key });
		const response = await s3Client.send(headCommand);

		// Build the file URL
		let endpoint = process.env.AWS_ENDPOINT_URL_S3 as string;
		if (endpoint.endsWith("/")) {
			endpoint = endpoint.slice(0, -1);
		}
		const fileUrl = `${endpoint}/${Bucket}/${Key}`;

		return {
			location: fileUrl,
			mimeType: response.ContentType ?? "application/octet-stream", // fallback if missing
		};
	} catch (error) {
		if (error instanceof Error && error.name === "NotFound") {
			console.warn(`File with ID '${fileId}' not found in bucket '${Bucket}'.`);
			return null;
		}
		console.error(`Error checking or getting file '${fileId}':`, error);
		throw error;
	}
}

export async function getFileByIds(fileIds: string[]) {
	const fileData: { location: string; mimeType: string }[] = [];

	for (const fileId of fileIds) {
		const info = await getFileById(fileId);
		if (info) {
			fileData.push(info);
		}
	}

	return fileData;
}
