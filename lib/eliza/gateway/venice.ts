/**
 * Venice/OpenAI-compatible chat inference gateway.
 *
 * This module emits app-owned stream callbacks only. Browser-facing SSE remains
 * the responsibility of app/api/eliza/chat/route.ts.
 */

import type { AgentCharacter, ChatMessage, StreamCallbacks } from './types'
import {
  WagdieElizaError,
  WagdieElizaNetworkError,
  getGatewayErrorCode,
  isRetryableGatewayStatus,
} from './errors'

type ChatRole = 'system' | 'user' | 'assistant'

export interface OpenAICompatibleChatMessage {
  role: ChatRole
  content: string
}

export interface OpenAICompatibleChatConfig {
  baseUrl: string
  apiKey: string
  model: string
  timeout?: number
  temperature?: number
  maxTokens?: number
}

export interface StreamOpenAICompatibleChatParams extends OpenAICompatibleChatConfig {
  messages: OpenAICompatibleChatMessage[]
  conversationId?: string
  signal?: AbortSignal
}

export interface CompleteOpenAICompatibleChatParams extends OpenAICompatibleChatConfig {
  messages: OpenAICompatibleChatMessage[]
  signal?: AbortSignal
  responseFormat?: Record<string, unknown>
}

export interface OpenAICompatibleCompletionResult {
  id?: string
  content: string
  finishReason?: string | null
}

type OpenAICompatibleStreamChunk = {
  id?: string
  choices?: Array<{
    delta?: {
      content?: string | null
    }
    message?: {
      content?: string | null
    }
    finish_reason?: string | null
  }>
  error?: {
    message?: string
  }
}

type OpenAICompatibleCompletionResponse = {
  id?: string
  choices?: Array<{
    message?: {
      content?: string | null
    }
    finish_reason?: string | null
  }>
  error?: {
    message?: string
  }
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function pushSection(lines: string[], title: string, values: string[]): void {
  if (values.length === 0) {
    return
  }

  lines.push(`${title}:`)
  for (const value of values) {
    lines.push(`- ${value}`)
  }
}

function getStyleRules(character: AgentCharacter, key: 'all' | 'chat'): string[] {
  const style = character.style
  if (!style || typeof style !== 'object') {
    return []
  }

  return asStringArray((style as Record<string, unknown>)[key])
}

function getExampleMessages(character: AgentCharacter): OpenAICompatibleChatMessage[] {
  if (!Array.isArray(character.messageExamples)) {
    return []
  }

  const examples: OpenAICompatibleChatMessage[] = []

  for (const pair of character.messageExamples.slice(0, 4)) {
    if (!Array.isArray(pair)) {
      continue
    }

    for (const message of pair) {
      const name = asString((message as { name?: unknown }).name)?.toLowerCase() ?? ''
      const text = asString((message as { content?: { text?: unknown } }).content?.text)
      if (!text) {
        continue
      }

      examples.push({
        role: name.includes('char') ? 'assistant' : 'user',
        content: text,
      })
    }
  }

  return examples
}

export function buildMessagesForCharacter(
  character: AgentCharacter,
  userMessage: string
): OpenAICompatibleChatMessage[] {
  const name = asString(character.name) ?? 'WAGDIE character'
  const lines = [
    `You are ${name}, an AI persona in the WAGDIE universe.`,
    'Stay in character and answer as this persona in a concise, immersive voice.',
  ]

  const systemPrompt =
    asString(character.system) || asString((character as Record<string, unknown>).systemPrompt)
  if (systemPrompt) {
    lines.push('', systemPrompt)
  }

  const legacyPersonality = asString((character as Record<string, unknown>).personality)
  const legacyBackstory = asString((character as Record<string, unknown>).backstory)
  const bio = asStringArray(character.bio)
  const lore = asStringArray(character.lore)

  pushSection(lines, 'Bio', bio.length > 0 ? bio : legacyPersonality ? [legacyPersonality] : [])
  pushSection(lines, 'Lore', lore.length > 0 ? lore : legacyBackstory ? [legacyBackstory] : [])
  pushSection(lines, 'Topics', asStringArray(character.topics))
  pushSection(lines, 'Adjectives', asStringArray(character.adjectives))
  pushSection(lines, 'Style rules', [
    ...getStyleRules(character, 'all'),
    ...getStyleRules(character, 'chat'),
  ])

  return [
    { role: 'system', content: lines.join('\n') },
    ...getExampleMessages(character),
    { role: 'user', content: userMessage },
  ]
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '')
}

function buildCompletionUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl)
  return normalized.endsWith('/chat/completions')
    ? normalized
    : `${normalized}/chat/completions`
}

function createAssistantMessage(content: string, id?: string): ChatMessage {
  return {
    id: id || globalThis.crypto?.randomUUID?.() || `msg_${Date.now()}`,
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
  }
}

function readDeltaContent(chunk: OpenAICompatibleStreamChunk): string | null {
  const choice = chunk.choices?.[0]
  return choice?.delta?.content || choice?.message?.content || null
}

function parseErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null
  }

  const error = (body as { error?: { message?: unknown } }).error
  return typeof error?.message === 'string' ? error.message : null
}

async function parseFailure(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await response.json()
      return parseErrorMessage(body) || `Provider request failed with ${response.status}`
    }

    const text = await response.text()
    return text || `Provider request failed with ${response.status}`
  } catch {
    return `Provider request failed with ${response.status}`
  }
}

export async function completeOpenAICompatibleChat(
  params: CompleteOpenAICompatibleChatParams
): Promise<OpenAICompatibleCompletionResult> {
  const controller = new AbortController()
  const timeoutId = params.timeout
    ? setTimeout(() => controller.abort(), params.timeout)
    : undefined

  const abortFromExternalSignal = () => controller.abort()
  if (params.signal) {
    if (params.signal.aborted) {
      controller.abort()
    } else {
      params.signal.addEventListener('abort', abortFromExternalSignal, { once: true })
    }
  }

  try {
    const response = await fetch(buildCompletionUrl(params.baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        stream: false,
        ...(typeof params.temperature === 'number' ? { temperature: params.temperature } : {}),
        ...(typeof params.maxTokens === 'number' ? { max_tokens: params.maxTokens } : {}),
        ...(params.responseFormat ? { response_format: params.responseFormat } : {}),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const message = await parseFailure(response)
      throw new WagdieElizaError(message, {
        code: getGatewayErrorCode(response.status),
        statusCode: response.status,
        isRetryable: isRetryableGatewayStatus(response.status),
      })
    }

    const body = await response.json() as OpenAICompatibleCompletionResponse
    if (body.error) {
      throw new WagdieElizaError(body.error.message || 'Provider completion error', {
        code: 'API_ERROR',
        statusCode: 502,
        isRetryable: true,
      })
    }

    const choice = body.choices?.[0]
    const content = choice?.message?.content
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new WagdieElizaError('Provider completion did not include assistant content', {
        code: 'API_ERROR',
        statusCode: 502,
        isRetryable: true,
      })
    }

    return {
      id: body.id,
      content,
      finishReason: choice?.finish_reason,
    }
  } catch (error) {
    if (error instanceof WagdieElizaError) {
      throw error
    }

    throw new WagdieElizaNetworkError(
      error instanceof Error ? error.message : 'Provider completion request failed',
      undefined,
      error
    )
  } finally {
    params.signal?.removeEventListener('abort', abortFromExternalSignal)

    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

export async function streamOpenAICompatibleChat(
  params: StreamOpenAICompatibleChatParams,
  callbacks: StreamCallbacks
): Promise<void> {
  const controller = new AbortController()
  const timeoutId = params.timeout
    ? setTimeout(() => controller.abort(), params.timeout)
    : undefined

  let fullContent = ''
  let providerMessageId = ''
  let completed = false
  const conversationId = params.conversationId || globalThis.crypto?.randomUUID?.() || `conv_${Date.now()}`

  const abortFromExternalSignal = () => controller.abort()
  if (params.signal) {
    if (params.signal.aborted) {
      controller.abort()
    } else {
      params.signal.addEventListener('abort', abortFromExternalSignal, { once: true })
    }
  }

  try {
    const response = await fetch(buildCompletionUrl(params.baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        stream: true,
        ...(typeof params.temperature === 'number' ? { temperature: params.temperature } : {}),
        ...(typeof params.maxTokens === 'number' ? { max_tokens: params.maxTokens } : {}),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(await parseFailure(response))
    }

    if (!response.body) {
      throw new Error('Provider response did not include a stream body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const handleLine = (line: string) => {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) {
        return
      }

      const data = trimmed.slice('data:'.length).trim()
      if (!data) {
        return
      }

      if (data === '[DONE]') {
        completed = true
        callbacks.onComplete?.(createAssistantMessage(fullContent, providerMessageId), conversationId)
        return
      }

      const parsed = JSON.parse(data) as OpenAICompatibleStreamChunk
      if (parsed.error) {
        throw new Error(parsed.error.message || 'Provider stream error')
      }

      if (parsed.id) {
        providerMessageId = parsed.id
      }

      const token = readDeltaContent(parsed)
      if (token) {
        fullContent += token
        callbacks.onChunk?.(token)
      }
    }

    let isReading = true
    while (isReading) {
      const { done, value } = await reader.read()
      if (done) {
        isReading = false
        continue
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        handleLine(line)
      }
    }

    if (buffer.trim()) {
      handleLine(buffer)
    }

    if (!completed) {
      callbacks.onComplete?.(createAssistantMessage(fullContent, providerMessageId), conversationId)
    }
  } catch (error) {
    callbacks.onError?.(error instanceof Error ? error : new Error('Provider stream error'))
  } finally {
    params.signal?.removeEventListener('abort', abortFromExternalSignal)

    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}
