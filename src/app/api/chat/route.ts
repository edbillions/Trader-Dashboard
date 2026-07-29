import { getAnthropicClient, AI_MODEL } from "@/lib/ai/client";
import { buildChatContext } from "@/lib/ai/chat-context";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  const client = await getAnthropicClient();
  if (!client) {
    return Response.json(
      { error: "AI features aren't available. Add your Claude API key in Settings." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { messages: ChatMessage[] };
  const messages = body.messages ?? [];
  if (messages.length === 0) {
    return Response.json({ error: "No messages provided." }, { status: 400 });
  }

  const context = await buildChatContext();

  const stream = client.messages.stream({
    model: AI_MODEL,
    max_tokens: 1024,
    output_config: { effort: "medium" },
    system:
      "You are an assistant embedded in a solo futures trader's personal " +
      "ICT-style trading journal. Answer questions about their own trading " +
      "data, and about their business and personal goals, using the summary " +
      "below. Be direct and specific with numbers when you have them; say " +
      "so plainly when you don't have the data to answer.\n\n" +
      `## Journal summary\n${context}`,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();
  let settled = false;
  const readable = new ReadableStream({
    start(controller) {
      stream.on("text", (text) => {
        controller.enqueue(encoder.encode(text));
      });
      stream.on("end", () => {
        if (settled) return;
        settled = true;
        controller.close();
      });
      stream.on("error", (err) => {
        if (settled) return;
        settled = true;
        if (err instanceof Error && err.message) {
          controller.enqueue(
            encoder.encode(`\n\n[Error: ${err.message}]`),
          );
        }
        controller.close();
      });
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
