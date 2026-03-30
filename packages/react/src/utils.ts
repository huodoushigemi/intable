import { version } from 'react'
import * as Client from 'react-dom/client'
import ReactDom from 'react-dom'

// 兼容 React 18 之前的版本
export function createRoot(container: HTMLElement) {
  if (version.startsWith('16.') || version.startsWith('17.')) return {
    render: (element) => ReactDom.render(element, container),
    unmount: () => ReactDom.unmountComponentAtNode(container)
  }
  return Client.createRoot(container)
}

// React 16/17 没有 flushSync，直接执行即可
export function flushSync(fn) {
  if (version.startsWith('16.') || version.startsWith('17.')) {
    return fn()
  }
  return ReactDom.flushSync(fn)
}