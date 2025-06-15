import { uploadFileToBucket } from "@/lib/files";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const file = formData.get("file") as File;

	if (!file) {
		return NextResponse.json({ success: false }, { status: 400 });
	}

	const fileId = randomUUID();
	const { Location } = await uploadFileToBucket(file, fileId);

	return NextResponse.json(
		{
			success: true,
			uploadUrl: Location,
			fileId,
		},
		{ status: 200 }
	);
}
