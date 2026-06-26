export type MessageRole = 'user' | 'assistant' | 'system'

export interface Conversation {
  id: string
  title: string
  model_id: string | null
  system_prompt: string | null
  created_at: string
  updated_at: string
  is_deleted: number
}

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  model_id: string | null
  tokens_used: number
  created_at: string
}

export interface CreateConversationRequest {
  title?: string
  model_id?: string
  system_prompt?: string
}

export interface CreateMessageRequest {
  role: MessageRole
  content: string
  model_id?: string
  tokens_used?: number
}

export interface ChatRequest {
  conversation_id: string
  content: string
  model_id?: string
}

export interface ModelInfo {
  id: string
  object: string
  created: number
  owned_by: string
}

export interface ModelListResponse {
  object: string
  data: ModelInfo[]
}

export interface Setting {
  key: string
  value: string
  updated_at: string
}

export interface PromptTemplate {
  id: string
  name: string
  content: string
  category: string
  is_system: number
  created_at: string
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string
  created_at: string
}

export interface KnowledgeDocument {
  id: string
  knowledge_base_id: string
  filename: string
  file_path: string
  file_type: string
  content: string
  created_at: string
}

export interface UploadedFile {
  id: string
  filename: string
  path: string
  size: number
  mimetype: string
  url: string
}
