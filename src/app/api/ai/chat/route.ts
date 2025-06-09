import { streamChatCompletion } from "@/lib/ai";

export async function POST(req: Request) {
	const { messages } = await req.json();
	const response = await streamChatCompletion("mistral-small", messages);
	return response.toDataStreamResponse();
}
