import { ToolCall } from 'ollama'
import pluginRepository, { ToolManifest } from '../plugins/repository'

export function getToolsManifest(): ToolManifest[] {
  return pluginRepository.toolsManifest
}

export function getToolDisplayName(toolCall: ToolCall): string {
  const functionName = toolCall.function.name

  const tool = pluginRepository.toolsManifest.find((tool) => tool?.function?.name === functionName)

  return tool?.function?.displayName || functionName
}

export async function callTool(toolCall: ToolCall): Promise<string> {
  return pluginRepository.callTool(toolCall)
}
