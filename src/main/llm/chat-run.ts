import { chatRunner } from './chat-runner'

export async function chatRun(chatUuid: string): Promise<void> {
  await chatRunner.chatRun(chatUuid)
}
