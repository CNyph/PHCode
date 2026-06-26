import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import CodeBlock from './CodeBlock'

interface MarkdownRendererProps {
  content: string
}

function preprocessLatex(content: string): string {
  let processed = content

  processed = processed.replace(/\$\$\n([\s\S]*?)\n\$\$/g, (_, math) => `$$${math}$$`)
  processed = processed.replace(/\$\n([\s\S]*?)\n\$/g, (_, math) => `$${math}$`)

  return processed
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const processedContent = useMemo(() => preprocessLatex(content), [content])

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeHighlight, rehypeKatex]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const isInline = !match && !className

          if (isInline) {
            return (
              <code
                className="px-1.5 py-0.5 rounded text-sm"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--accent)'
                }}
                {...props}
              >
                {children}
              </code>
            )
          }

          return (
            <CodeBlock language={match?.[1]}>
              {String(children).replace(/\n$/, '')}
            </CodeBlock>
          )
        },
        p({ children }) {
          return (
            <p className="mb-2 last:mb-0" style={{ color: 'var(--text-primary)' }}>
              {children}
            </p>
          )
        },
        h1({ children }) {
          return (
            <h1 className="text-xl font-bold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
              {children}
            </h1>
          )
        },
        h2({ children }) {
          return (
            <h2 className="text-lg font-bold mt-3 mb-2" style={{ color: 'var(--text-primary)' }}>
              {children}
            </h2>
          )
        },
        h3({ children }) {
          return (
            <h3 className="text-base font-bold mt-3 mb-1" style={{ color: 'var(--text-primary)' }}>
              {children}
            </h3>
          )
        },
        ul({ children }) {
          return (
            <ul className="list-disc list-inside mb-2 space-y-1" style={{ color: 'var(--text-primary)' }}>
              {children}
            </ul>
          )
        },
        ol({ children }) {
          return (
            <ol className="list-decimal list-inside mb-2 space-y-1" style={{ color: 'var(--text-primary)' }}>
              {children}
            </ol>
          )
        },
        li({ children }) {
          return <li className="text-sm">{children}</li>
        },
        blockquote({ children }) {
          return (
            <blockquote
              className="border-l-4 pl-4 my-2 italic"
              style={{
                borderColor: 'var(--accent)',
                color: 'var(--text-secondary)'
              }}
            >
              {children}
            </blockquote>
          )
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--accent)' }}
            >
              {children}
            </a>
          )
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-2">
              <table
                className="w-full text-sm border-collapse"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {children}
              </table>
            </div>
          )
        },
        thead({ children }) {
          return (
            <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
              {children}
            </thead>
          )
        },
        th({ children }) {
          return (
            <th
              className="px-3 py-2 text-left font-medium"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td
              className="px-3 py-2"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              {children}
            </td>
          )
        },
        hr() {
          return (
            <hr
              className="my-4"
              style={{ borderColor: 'var(--border-color)' }}
            />
          )
        },
        strong({ children }) {
          return <strong className="font-semibold">{children}</strong>
        },
        em({ children }) {
          return <em className="italic">{children}</em>
        }
      }}
    >
      {processedContent}
    </ReactMarkdown>
  )
}
