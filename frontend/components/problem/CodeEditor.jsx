import Editor from '@monaco-editor/react'
import { Code2 } from 'lucide-react'

export function CodeEditor({ code, language, onChange }) {
  return (
    <div className="flex-1 relative bg-[#1e1e1e]">
      <Editor
        height="100%"
        theme="vs-dark"
        language={language === 'python' ? 'python' : language === 'javascript' ? 'javascript' : language === 'java' ? 'java' : 'cpp'}
        value={code}
        onChange={(val) => onChange(val)}
        options={{
          fontSize: 15,
          minimap: { enabled: false },
          scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
          lineNumbers: 'on',
          glyphMargin: false,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontWeight: '500',
          lineHeight: 1.6,
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 30, left: 30 },
          wordWrap: "on"
        }}
      />
      <div className="absolute top-8 right-10 pointer-events-none opacity-5">
        <Code2 className="w-24 h-24 text-white" />
      </div>
    </div>
  )
}
