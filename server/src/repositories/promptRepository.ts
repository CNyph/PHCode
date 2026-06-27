import { v4 as uuidv4 } from 'uuid'
import { queryAll, queryOne, run } from './database.js'
import type { PromptTemplate } from '../models/types.js'

export function getAllPrompts(userId?: string): PromptTemplate[] {
  return queryAll<PromptTemplate>(
    'SELECT * FROM prompt_templates WHERE is_system = 1 OR user_id = ? ORDER BY is_system DESC, created_at DESC',
    [userId || null]
  )
}

export function getPromptsByCategory(category: string, userId?: string): PromptTemplate[] {
  return queryAll<PromptTemplate>(
    'SELECT * FROM prompt_templates WHERE category = ? AND (is_system = 1 OR user_id = ?) ORDER BY created_at DESC',
    [category, userId || null]
  )
}

export function getPromptById(id: string, userId?: string): PromptTemplate | undefined {
  return queryOne<PromptTemplate>(
    'SELECT * FROM prompt_templates WHERE id = ? AND (is_system = 1 OR user_id = ?)',
    [id, userId || null]
  )
}

export function createPrompt(data: { name: string; content: string; category: string }, userId?: string): PromptTemplate {
  const id = uuidv4()
  const now = new Date().toISOString()
  run(
    'INSERT INTO prompt_templates (id, user_id, name, content, category, is_system, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
    [id, userId || null, data.name, data.content, data.category, now]
  )
  return getPromptById(id, userId)!
}

export function updatePrompt(id: string, data: Partial<{ name: string; content: string; category: string }>, userId?: string): PromptTemplate | null {
  const existing = getPromptById(id, userId)
  if (!existing) return null

  const fields: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
  if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content) }
  if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category) }

  if (fields.length === 0) return existing

  values.push(id)
  if (userId) {
    values.push(userId)
    run(`UPDATE prompt_templates SET ${fields.join(', ')} WHERE id = ? AND (is_system = 1 OR user_id = ?)`, values)
  } else {
    run(`UPDATE prompt_templates SET ${fields.join(', ')} WHERE id = ?`, values)
  }

  return getPromptById(id, userId)!
}

export function deletePrompt(id: string, userId?: string): boolean {
  const existing = getPromptById(id, userId)
  if (!existing || existing.is_system) return false
  if (userId) {
    run('DELETE FROM prompt_templates WHERE id = ? AND user_id = ?', [id, userId])
  } else {
    run('DELETE FROM prompt_templates WHERE id = ?', [id])
  }
  return true
}

export function seedDefaultPrompts(): void {
  const count = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM prompt_templates')
  if (count && count.count > 0) return

  const defaults = [
    { name: '翻译助手', content: '请将以下内容翻译成{目标语言}，保持原意和格式：\n\n{内容}', category: '翻译' },
    { name: '中英互译', content: '请判断以下内容的语言，如果是中文则翻译成英文，如果是英文则翻译成中文：\n\n{内容}', category: '翻译' },
    { name: '文本总结', content: '请对以下内容进行简洁总结，提取关键信息，控制在100字以内：\n\n{内容}', category: '写作' },
    { name: '论文润色', content: '请对以下学术论文段落进行润色，提升表达的专业性和流畅度，保持学术风格：\n\n{内容}', category: '写作' },
    { name: 'Code Review', content: '请对以下代码进行 Code Review，指出潜在问题、性能优化建议和代码风格改进：\n\n```{语言}\n{代码}\n```', category: '编程' },
    { name: '代码解释', content: '请解释以下代码的功能和逻辑，逐行或逐块说明：\n\n```{语言}\n{代码}\n```', category: '编程' },
    { name: '写单元测试', content: '请为以下代码编写单元测试，覆盖主要场景和边界情况：\n\n```{语言}\n{代码}\n```', category: '编程' },
    { name: 'SQL 优化', content: '请分析以下 SQL 查询，指出性能问题并提供优化建议：\n\n```sql\n{SQL}\n```', category: '编程' },
    { name: '周报生成', content: '请根据以下工作内容，生成一份简洁的周报，包含完成事项、进行中事项和下周计划：\n\n{内容}', category: '办公' },
    { name: '邮件助手', content: '请帮我撰写一封{类型的}邮件，收件人是{收件人}，主题是{主题}，要点如下：\n\n{要点}', category: '办公' },
  ]

  const now = new Date().toISOString()
  for (const p of defaults) {
    const id = uuidv4()
    run(
      'INSERT INTO prompt_templates (id, name, content, category, is_system, created_at) VALUES (?, ?, ?, ?, 1, ?)',
      [id, p.name, p.content, p.category, now]
    )
  }
}
