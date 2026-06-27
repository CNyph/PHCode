export type MessageRole = 'user' | 'assistant' | 'system'

export interface AuthUser {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface Conversation {
  id: string
  user_id?: string | null
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
  user_id?: string | null
  parent_message_id: string | null
  branch_id: string
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
  parent_message_id?: string
  branch_id?: string
}

export interface ChatRequest {
  conversation_id: string
  content: string
  model_id?: string
  knowledge_base_id?: string
  web_search?: boolean
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
  resolved_ollama_url?: string | null
}

export interface Setting {
  key: string
  value: string
  user_id?: string | null
  updated_at: string
}

export interface PromptTemplate {
  id: string
  user_id?: string | null
  name: string
  content: string
  category: string
  is_system: number
  created_at: string
}

export interface KnowledgeBase {
  id: string
  user_id?: string | null
  name: string
  description: string
  created_at: string
}

export interface KnowledgeDocument {
  id: string
  knowledge_base_id: string
  user_id?: string | null
  filename: string
  file_path: string
  file_type: string
  content: string
  embedding: string | null
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
