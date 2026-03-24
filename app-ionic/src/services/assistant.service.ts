import { api } from "./api";

export interface AssistantReply {
  configured: boolean;
  response: string;
  previousResponseId: string | null;
  model?: string;
}

export async function sendAssistantMessage(
  message: string,
  previousResponseId?: string | null,
): Promise<AssistantReply> {
  const result = await api.post<{ success: boolean; data: AssistantReply }>(
    "/api/assistant/chat",
    {
      message,
      previousResponseId: previousResponseId || null,
    },
    true,
  );

  return result.data;
}
