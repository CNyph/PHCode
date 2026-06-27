import type { Conversation, Message } from '../types/api'

export function exportToJson(conversations: Conversation[], messages: Message[]): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    conversations: conversations.map((conv) => ({
      ...conv,
      messages: messages.filter((m) => m.conversation_id === conv.id),
    })),
  }
  return JSON.stringify(data, null, 2)
}

export function exportToMarkdown(conversations: Conversation[], messages: Message[]): string {
  let markdown = '# PHCode 聊天记录导出\n\n'
  markdown += `导出时间：${new Date().toLocaleString('zh-CN')}\n\n---\n\n`

  for (const conv of conversations) {
    const convMessages = messages.filter((m) => m.conversation_id === conv.id)
    markdown += `## ${conv.title}\n\n`
    markdown += `模型：${conv.model_id || '默认'}\n\n`

    for (const msg of convMessages) {
      const role = msg.role === 'user' ? '**用户**' : '**AI**'
      markdown += `${role}：\n\n${msg.content}\n\n`
    }

    markdown += '---\n\n'
  }

  return markdown
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importFromJson(
  file: File,
): Promise<{ conversations: Conversation[]; messages: Message[] }> {
  const text = await file.text()
  const data = JSON.parse(text)

  if (!data.conversations || !Array.isArray(data.conversations)) {
    throw new Error('无效的导入文件格式')
  }

  const conversations: Conversation[] = []
  const messages: Message[] = []

  for (const conv of data.conversations) {
    conversations.push({
      id: conv.id,
      title: conv.title,
      model_id: conv.model_id || null,
      system_prompt: conv.system_prompt || null,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      is_deleted: conv.is_deleted || 0,
    })

    if (conv.messages && Array.isArray(conv.messages)) {
      for (const msg of conv.messages) {
        messages.push({
          id: msg.id,
          conversation_id: conv.id,
          parent_message_id: msg.parent_message_id || null,
          branch_id: msg.branch_id || 'main',
          role: msg.role,
          content: msg.content,
          model_id: msg.model_id || null,
          tokens_used: msg.tokens_used || 0,
          created_at: msg.created_at,
        })
      }
    }
  }

  return { conversations, messages }
}
