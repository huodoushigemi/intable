import { For, splitProps, type Component,  } from "solid-js"
import { Dynamic } from "solid-js/web"

const unFn = (fn, ...arg) => typeof fn == 'function' ? fn(...arg) : fn

export function createRender({ is, processProps = e => e } = {}) {
  const Render = (props: any) => {
    const [reserve, attrs] = splitProps(processProps?.(props), ['is', 'vIf', 'children'])
    return (<>
      { (!('vIf' in reserve) || !!unFn(reserve.vIf)) &&
        <Dynamic component={reserve.is ?? is} {...attrs}>
          <List each={reserve.children} />
        </Dynamic>
      }
    </>)
  }

  const List: Component = ({ each }) => (
    <>
      {Array.isArray(each) ? <For each={each}>{e => typeof e == 'object' ? Render(e) : e}</For> : each}
    </>
  )

  return Render
}

export const Render = createRender({ is: 'div' })