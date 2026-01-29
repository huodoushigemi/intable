import { useEffect, useRef, createElement as h, type FC } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { type TableProps } from 'intable'
import 'intable/wc'
// import './style.scss'

import { AntdPlugin } from './plugins/antd'
import { onCleanup } from 'solid-js'


const Intable: FC<TableProps> = (props) => {
  const ref = useRef<any>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.options = {
        ...props,
        renderer: component,
        plugins: [
          AntdPlugin,
          ...(props.plugins || [])
        ],
      } as TableProps
    }
  }, [props])

  return h('wc-table', { ref, style: { display: 'contents' } })
}


const component = <T extends Record<string, any>>(Comp: FC<T>) => {
  return (props: T) => {
    const el = document.createDocumentFragment()
    el.remove ??= () => {}

    const root = createRoot(el)
    flushSync(() => root.render(h(Comp, props)))
    onCleanup(() => root.unmount())
    
    return el
  }
}

export default Intable
