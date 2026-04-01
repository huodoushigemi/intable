import { useEffect, useRef, createElement as h, type FC } from 'react'
import { createRoot, flushSync } from './utils'

import { solidComponent } from '../../intable/src/components/utils'
// #if DEV
import '../../intable/src/wc'
// #else
import 'intable/wc'
import { type TableProps } from 'intable'
// #endif

import './style.scss'

import { createComputed, onCleanup } from 'solid-js'


export const Intable: FC<TableProps> = (props) => {
  const ref = useRef<any>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.options = {
        class: props.className,
        ...props,
        renderer: component,
      } as TableProps
    }
  }, [props])

  return h('wc-table', { ref, style: { display: 'contents' } })
}


export const component = <T extends Record<string, any>>(Comp: FC<T>) => {
  return solidComponent((props: T) => {
    const el = document.createElement('div')
    el.style.display = 'contents'

    const root = createRoot(el)

    createComputed(() => flushSync(() => root.render(typeof Comp === 'function' ? h(Comp, props) : Comp)))
    onCleanup(() => root.unmount())

    return el
  })
}

export default Intable
