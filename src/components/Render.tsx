import { splitProps } from "solid-js"
import { Dynamic } from "solid-js/web"

export function createRender({ is, processProps = e => e } = {}) {
  const Render = (props: any) => {
    const [reserve, attrs] = splitProps(processProps?.(props), ['is', 'vIf', 'children'])
    return (
      <Dynamic component={reserve.is ?? is} {...attrs}>
        {List(reserve.children)}
      </Dynamic>
    )
  }

  const List = children => (
    Array.isArray(children) ? children.map(e => typeof e == 'object' ? Render(e) : e) :
    children
  )

  return Render
}

export const Render = createRender({ is: 'div' })