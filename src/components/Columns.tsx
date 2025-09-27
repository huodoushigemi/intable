import { createEffect, createMemo, createSignal, mergeProps, onCleanup, onMount, splitProps } from 'solid-js'
import { render } from 'solid-js/web'
import { createMutationObserver } from '@solid-primitives/mutation-observer'
import { createElementBounds } from '@solid-primitives/bounds'
import { clamp, sum } from 'es-toolkit'
import { usePointerDrag } from '../hooks'

export const Columns = (attrs: Partial<{ gap: number }>) => {
  const [_, props] = splitProps(mergeProps({ gap: 0 }, attrs), ['children'])

  let ref!: HTMLElement

  const [children, setChildren] = createSignal<HTMLElement[]>([])
  const cols = createMemo(() => children().length)
  
  const update = () => setChildren([...ref!.querySelectorAll('& > [tiptap-is="column"]')])
  onMount(() => update())
  createMutationObserver(() => ref, { childList: true }, () => {
    update()
    container.parentElement || ref.insertBefore(container, ref.firstChild)
  })

  const container = <div style='position: absolute; z-index: 1' /> as HTMLElement
  const bounds2 = createElementBounds(() => container, { trackScroll: false })
  createEffect(() => {
    ref.insertBefore(container, ref.firstChild)
    onCleanup(() => container.remove())
  })

  createEffect(() => {
    children().forEach((el, i) => {
      if (i == children().length - 1) return
      const dispose = render(() => <Hand index={i} gap={props.gap} reference={el} bounds2={bounds2} onAdd={props.onAdd} />, container)
      onCleanup(dispose)
    })
    const cw = ref.offsetWidth
    const tgap = (cols() - 1) * props.gap
    const meanw = (cw - tgap) / cols()
    children().forEach(el => el.style.width ||= `${meanw}px`)
    const ws = children().map(el => el.offsetWidth)
    const sumw = sum(ws) + tgap
    const sgap =  tgap / cols()
    children().forEach((el, i) => el.style.width = `calc(${(ws[i] + sgap) / sumw * 100}% - ${sgap}px)`)
  })
  
  return (
    <div ref={ref} style={`display: flex; gap: ${props.gap}px;`} {...props} cols={cols()}>
      {attrs.children}
    </div>
  )
}

const Hand = (props) => {
  const bounds = createElementBounds(props.reference, { trackScroll: false })
  
  const style = createMemo(() => (`
    position: absolute;
    width: ${props.gap}px;
    height: ${bounds.height}px;
    transform: translate(${bounds.right - props.bounds2.left}px, ${bounds.top - props.bounds2.top}px);
  `))

  let el: HTMLElement
  usePointerDrag(() => el, {
    start(e, move) {
      const col = props.reference!
      const container = col.parentElement!, cw = container.offsetWidth
      const [cols, gap] = [+container.getAttribute('cols')!, +container.getAttribute('gap')!]
      const [left, right] = [col, col.nextElementSibling as HTMLElement]
      const [lw, rw] = [left?.offsetWidth || 0, right?.offsetWidth || 0]
      const minw = cw * .05, maxw = lw + rw - minw
      const sgap = (cols - 1) * gap / cols

      move((e, { ox }) => {
        left && (left.style.width = `calc(${(clamp(lw + ox, minw, maxw) + sgap) / cw * 100}% - ${sgap}px)`)
        right && (right.style.width = `calc(${(clamp(rw - ox, minw, maxw) + sgap) / cw * 100}% - ${sgap}px)`)
      })
    },
  })
  
  return (
    <div ref={el} ref={props.ref} class='col-hand' style={style()} contenteditable='false'>
      {props.onAdd && <div class='dot' onClick={() => props.onAdd(props.index)} on:pointerdown={{ handleEvent: e => e.stopPropagation() }} />}
    </div>
  )
}