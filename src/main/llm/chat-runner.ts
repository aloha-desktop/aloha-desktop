import { BrowserWindow } from 'electron'
import ollama, { AbortableAsyncIterator, ToolCall } from 'ollama'
import { ChatResponse } from 'ollama'
import { getChat, updateChatName, DEFAULT_CHAT_NAME } from '../storage/chat-crud'
import { createMessage, getMessages, saveMessageContent } from '../storage/messages-crud'
import { ChatMessage } from '@common/types/chat-message'
import { callTool, getToolDisplayName, getToolsManifest } from '../tools'
import { getDefaultModel } from './default-model'
import { getModelDetails } from './model-details'
import { activeChats } from './active-chats'
import { WindowEmitter } from '../window-emitter'
import { Chat } from '@common/types/chat'
import { DEFAULT_TITLE_GENERATION_PROMPT_TEMPLATE, DEFAULT_TITLE_GENERATION_PROMPT_THOUGHTS } from './templates'
import { ModelDetails } from '@common/types/model-capability'
import log from 'electron-log'

class ChatRunner extends WindowEmitter {
  private emitChatGenerating(chatUuid: string): void {
    this.emitToAllWindows('llm:chat-generating', chatUuid)
  }

  async emitStream(model: string, chatUuid: string, stream: AbortableAsyncIterator<ChatResponse>): Promise<boolean> {
    let role: string = 'assistant' // assume initial role is assistant
    let newMessage: boolean = true
    let chatMessage: ChatMessage = createMessage(model, role, '', chatUuid)
    let contentChunks: string[] = []
    let thinkingChunks: string[] = []
    const toolCalls: ToolCall[] = []
    const thinking: {
      start: number | null
      end: number | null
    } = {
      start: null,
      end: null,
    }

    try {
      for await (const chunk of stream) {
        // if role changes - save chunks and reset
        if (role !== chunk.message.role) {
          const thinkingTime = thinking.start && thinking.end ? thinking.end - thinking.start : null
          saveMessageContent(
            chatMessage.uuid,
            contentChunks.join(''),
            thinkingChunks.join('') || null,
            thinkingTime,
            null
          ) // save previous role messages
          role = chunk.message.role
          newMessage = true
          contentChunks = []
          thinkingChunks = []
          thinking.start = null
          thinking.end = null

          chatMessage = createMessage(model, role, '', chatUuid)
        }

        if (chunk.message.thinking) {
          // THINKING  -----------

          if (!thinking.start) {
            thinking.start = Date.now()
          }
          thinkingChunks.push(chunk.message.thinking)
        }

        if (chunk.message.content) {
          // CONTENT  -----------

          if (thinking.start && !thinking.end) {
            thinking.end = Date.now()
          }
          contentChunks.push(chunk.message.content)
        }

        if (chunk.done) {
          // mark thinking done if no content emitted
          if (thinking.start && !thinking.end) {
            thinking.end = Date.now()
          }
        }

        // accumulate tool calls
        if (chunk.message.tool_calls) {
          toolCalls.push(...chunk.message.tool_calls)
        }

        this.emitToAllWindows(
          'llm:chat-message',
          chatMessage,
          contentChunks, // emit entire contentChunks array
          thinkingChunks, // emit entire thinkingChunks array
          thinking.start ? (thinking.end ? thinking.end - thinking.start : Date.now() - thinking.start) : null,
          newMessage,
          chunk.done,
          chunk.done ? toolCalls : undefined // emit tool calls only when done
        )
        newMessage = false // reset flag after sending
      }
    } catch (error) {
      log.error('Chat stream error:', error)
    }

    // all chunks done or stream aborted/failed

    const thinkingTime = thinking.start && thinking.end ? thinking.end - thinking.start : null
    saveMessageContent(
      chatMessage.uuid,
      contentChunks.join(''),
      thinkingChunks.join('') || null,
      thinkingTime,
      toolCalls
    ) // content is saved, last message has tool calls added

    // streaming chunks done, let's see if we have any tool calls
    if (toolCalls?.length) {
      for (const toolCall of toolCalls) {
        const metadata = {
          ...toolCall.function,
          displayName: getToolDisplayName(toolCall),
        }

        try {
          this.emitChatGenerating(chatUuid)
          const result = await callTool(toolCall)
          const responseMessage = createMessage(model, 'tool', `${result}`, chatUuid, metadata)
          this.emitToAllWindows(
            'llm:chat-message',
            responseMessage,
            [responseMessage.content], // emit as array to match new format
            [], // empty thinking chunks array
            null,
            true,
            true, // done streaming
            undefined
          )
        } catch (error) {
          log.error('Plugin tool call error:', toolCall.function.name, toolCall.function.arguments, error)
          const errorMessage = createMessage(
            model,
            'tool',
            error instanceof Error ? error.message : 'Unknown error',
            chatUuid,
            metadata
          )
          this.emitToAllWindows(
            'llm:chat-message',
            errorMessage,
            [errorMessage.content], // emit as array to match new format
            [], // empty thinking chunks array
            null,
            true,
            true, // done streaming
            undefined
          )
        }
      }

      // all tools called
      return true // continue
    }

    return false // no tool calls, but done
  }

  async chatRun(chatUuid: string): Promise<void> {
    const chat = getChat(chatUuid)

    if (!chat) {
      throw new Error('Chat not found')
    }

    let continueRun = true
    const model = getDefaultModel()
    const details = await getModelDetails(model)

    while (continueRun) {
      this.emitChatGenerating(chat.uuid)

      const messages = getMessages(chat.uuid)

      if (!model) {
        throw new Error('Please select a model in the settings.')
      }

      const stream = await ollama.chat({
        model: model,
        messages: messages,
        stream: true,
        think: details.capabilities.includes('thinking'),
        tools: details.capabilities.includes('tools') ? getToolsManifest() : undefined,
      })

      try {
        activeChats.add(chat.uuid, stream)
        continueRun = await this.emitStream(model, chat.uuid, stream)
      } finally {
        activeChats.remove(chat.uuid)
      }
    }

    if (chat.name === DEFAULT_CHAT_NAME) {
      await this.generateTitle(chat, details)
    }
  }

  async generateTitle(chat: Chat, modelDetails: ModelDetails): Promise<void> {
    const messages = getMessages(chat.uuid)
    const userMessage = messages.find((message) => message.role === 'user')
    const assistantMessage = messages
      .filter((messages) => messages.content?.trim() !== '')
      .find((message) => message.role === 'assistant')

    if (!userMessage && !assistantMessage) {
      return // no messages to generate title from
    }

    const prompt = DEFAULT_TITLE_GENERATION_PROMPT_TEMPLATE.replace(
      '{{MESSAGES}}',
      [userMessage, assistantMessage]
        .filter((message) => !!message)
        .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
        .join('\n')
    )
    const thoughts = DEFAULT_TITLE_GENERATION_PROMPT_THOUGHTS.replace('{{USER_MESSAGE}}', userMessage?.content || '')

    const response = await ollama.chat({
      model: modelDetails.name,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
        {
          role: 'assistant',
          content: thoughts,
        },
      ],
      think: false,
      stream: false,
    })

    let title = userMessage?.content || DEFAULT_CHAT_NAME

    try {
      const jsonPart = response.message.content.match(/{[\s\S]*?}/)?.[0] || `{"title": "${DEFAULT_CHAT_NAME}"}`
      title = JSON.parse(jsonPart).title
    } catch (error) {
      log.error('Title generation response parsing error of:', response.message.content, error)
    }

    updateChatName(chat.uuid, title)

    this.emitToAllWindows('llm:chat-title', chat.uuid, title)
  }
}

// Export singleton instance
export const chatRunner = new ChatRunner()

export function useChatRunner(browserWindow: BrowserWindow): void {
  // Register this window to receive chat updates
  chatRunner.registerWindow(browserWindow)
}
