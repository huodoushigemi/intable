import { delay, isFunction, isPlainObject, isPromise } from "es-toolkit"
import { useMemoAsync } from "./hooks"

export function file2base64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
  })
}

export function chooseFile(opts: { accept?: string; multiple?: false }): Promise<File>
export function chooseFile(opts: { accept?: string; multiple: true }): Promise<File[]>

export function chooseFile(opts?) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = opts?.accept
    input.multiple = opts?.multiple
    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        resolve(input.multiple ? [...input.files] : input.files[0])
      } else {}
    }
    input.oncancel = reject
    input.click()
  })
}

export function chooseImage() {
  return chooseFile({ accept: 'image/*' })
}

// export async function html2docx(content: string) {
//   const { inline, initWasm } = await import('@css-inline/css-inline-wasm')
//   const wasm = fetch(await import('@css-inline/css-inline-wasm/index_bg.wasm?url').then((e) => e.default))
//   await initWasm(wasm).catch(() => {})

//   content = inline(content + getStyles())
//   const blob = await import('html-docx-js-typescript').then((e) => e.asBlob(content))
//   return blob as Blob
// }

export async function print(html: string) {
  const iframe = document.createElement('iframe')
  const styles = [...document.querySelectorAll('style'), ...document.querySelectorAll('link[rel="stylesheet"]')] as HTMLElement[]
  iframe.srcdoc = `${styles.map(e => e.outerHTML).join('\n')}\n\n${html}`
  Object.assign(iframe.style, { position: 'fixed', display: 'none' })
  document.body.append(iframe)
  await new Promise(resolve => iframe.contentWindow.addEventListener('load', resolve, { once: true }))
  await delay(300)
  iframe.contentWindow.print()
  iframe.remove()
}

export function mergeRect(rect1: DOMRect, rect2: DOMRect) {
  return DOMRect.fromRect({
    x: Math.min(rect1.x, rect2.x),
    y: Math.min(rect1.y, rect2.y),
    width: Math.max(rect1.right, rect2.right) - Math.min(rect1.x, rect2.x),
    height: Math.max(rect1.bottom, rect2.bottom) - Math.min(rect1.y, rect2.y),
  })
}

export function getStyles(el = document as ParentNode) {
  return [...el.querySelectorAll('style'), ...el.querySelectorAll('link[rel="stylesheet"]')].map(e => e.outerHTML).join('\n')
}

export const unFn = (fn, ...args) => typeof fn == 'function' ? fn(...args) : fn

export const log = (...args) => (console.log(...args), args[0])

export const parseStyle = s => s ? s.split(';').reduce((o, e) => ((([k, v]) => o[k.trim()] = v.trim())(e.split(':')), o), {}) : {}

export function findret<T, R>(arr: readonly T[], cb: (e: T, i: number) => R): R | undefined {
  for (let i = 0; i < arr.length; i++) {
    const ret = cb(arr[i], i)
    if (ret != null) return ret
  }
}

type Fnable<T> = T | (() => T)
type Awatable<T> = T | Promise<T>
type BaseType = string | number | boolean | null

const cache = new WeakMap

export function resolveOptions(opts: Fnable<Awatable<Record<string, any> | ({ label: any; value: any } | BaseType)[]>>): { label: any; value: any }[] {
  let ret = opts
  if (isFunction(ret)) ret = ret()
  if (isPromise(ret)) {
    if (cache.has(ret)) return cache.get(ret)()
    cache.set(ret, useMemoAsync(() => ret.then(e => e.map(e => resolveOptions(e)))))
    return cache.get(ret)()
  }
  if (isPlainObject(ret)) ret = Object.entries(ret).map(([k, v]) => ({ value: k, label: v, ...v }))
  return (ret as any[])?.map(e => resolveOpt(e)) || []
}

function resolveOpt(opt) {
  return (
    isPlainObject(opt) ? opt :
    Array.isArray(opt) ? { label: opt[0], value: opt[1] } :
    { label: opt, value: opt }
  )
}