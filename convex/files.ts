import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { getFileByIds } from "../src/lib/files";

export const getFilesByIds = internalAction({
	args: { fileIds: v.array(v.string()) },
	handler: async (_ctx, { fileIds }) => {
		return await getFileByIds(fileIds);
	},
});
