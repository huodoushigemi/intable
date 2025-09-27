import type { Editor, NodeType } from '@tiptap/core'
import { useMemoAsync } from '../hooks'
import { createEffect, createMemo, createSignal, splitProps } from 'solid-js'
import { delay } from 'es-toolkit'
import { Tree } from './Tree'

export function DocTree(_: { editor: Editor }) {
  const [props, attrs] = splitProps(_, ['editor'])

  const [count, setCount] = createSignal(0)
  createEffect(() => props.editor.on('update', () => setCount(v => ++v)))

  const json = useMemoAsync(() => (count(), delay(300).then(() => props.editor.getJSON())), {})

  const headings = createMemo(() => {
    return (function walker (node: NodeType, queue = [], queue2 = []) {
      if (node.type === 'heading') {
        let i = queue.length
        while (i--) if (queue[i].level < node.attrs.level) break
        const item = { label: node.content?.map(e => e.text).join(''), level: node.attrs.level }
        queue.push(item)
        if (i > -1) (queue[i].children ??= []).push(item)
        else queue2.push(item)
      } else {
        node.content?.forEach(e => walker(e, queue, queue2))
      }
      return queue2
    })(json())
  })

  return (
    <div class="doc-tree" {...attrs}>
      <Tree data={headings()} class='min-h-40 max-h-100 overflow-auto' />
    </div>
  )
}
