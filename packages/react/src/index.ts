import { useEffect, useRef, createElement as h, type FC } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { type TableProps } from 'intable'

// #if DEV
import '../../intable/src/wc'
// #else
import 'intable/wc'
// #endif

import './style.scss'

import { createComputed, onCleanup } from 'solid-js'


export const Intable: FC<TableProps> = (props) => {
  const ref = useRef<any>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.options = {
        ...props,
        renderer: component,
      } as TableProps
    }
  }, [props])

  return h('wc-table', { ref, style: { display: 'contents' } })
}


export const component = <T extends Record<string, any>>(Comp: FC<T>) => {
  return (props: T) => {
    // const el = document.createDocumentFragment()
    // el.remove ??= () => {}
    const el = document.createElement('div')

    const root = createRoot(el)

    createComputed(() => flushSync(() => root.render(h(Comp, props))))
    onCleanup(() => root.unmount())

    return el
  }
}

export default Intable
