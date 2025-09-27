import { children, createContext, createEffect, createMemo, createResource, createSignal, mergeProps, onMount, splitProps, useContext } from "solid-js"
import { isEmpty } from 'es-toolkit/compat'
import { createRender } from "./Render"
import { autoUpdate, createFloating, offset } from "floating-ui-solid"
import { combineProps } from '@solid-primitives/props'
import { pointerHover } from "@solid-primitives/pointer"
import { createMutable } from "solid-js/store"
import { delay } from "es-toolkit"
import { log, unFn } from "../utils"
import { VDir } from "../hooks/useDir"
import { Popover } from "./Popover"
import { useSignle2 } from "../hooks"

export function Menu(props) {
  const MenuCtx = createContext({ deep: 0 })
  
  const _Li = _e => {
    const ctx = useContext(MenuCtx)
    const [e, attrs] = splitProps(_e, ['children', 'label', 'icon', 'isActive', 'cb', 'menu', 'popover'])

    const x = createMemo(() => props.x && ctx.deep == 1)

    let el!: HTMLDivElement
    const [floating, setFloating] = createSignal<HTMLElement>()
    const [hover, setHover] = useSignle2(false, { before: () => delay(100) })
    pointerHover
    
    const style = createMemo(() => floating() ? createFloating({
      strategy: 'fixed',
      placement: x() ? 'bottom-start' : 'right-start',
      ...e.menu,
      elements: { reference: () => el, floating },
      whileElementsMounted(ref, float, update) {
        return autoUpdate(ref, float, update, { ancestorResize: true, elementResize: true, layoutShift: true, ancestorScroll: true })
      }
    }).floatingStyles : void 0)
    
    createEffect(() => {
      floating() && Object.assign(floating()!.style, style()?.() ?? {})
    })

    const req = createMutable({ loading: false })

    function onClick() {
      if (req.loading) return
      const ret = e.cb?.()
      if (!(ret instanceof Promise)) return
      req.loading = true
      ret.finally(() => req.loading = false)
    }

    onMount(() => {
      <Popover strategy='fixed' reference={el} portal={el} {..._e.popover} middleware={[offset({ mainAxis: 4 })]} />
    })

    const child = children(() => e.children)
    return (
      <div
        ref={el}
        use:pointerHover={setHover}
        {...combineProps({ class: `li flex aic rd-2 ${x() ? 'my-1 p-1' : 'mx-1 pl-1 pr-4 py-1'} ${unFn(e.isActive) && 'active'}` }, attrs)}
        on:click={onClick}
      >
        <div class={`flex aic ${x() ? '' : props.density == 'comfortable' ? 'ml-1 mr-2.5' : 'ml-.5 mr-1'} `}>
          {req.loading ? <IMyLoading /> : e.icon}
        </div>
        {e.label}
        {/* {hover() && child() && <_Menu ref={setFloating}>{child()}</_Menu>} */}
        {hover() && e.children && <_Menu ref={setFloating} class='z-1'>{e.children}</_Menu>}
      </div>
    )
  }

  const Li = createRender({
    is: _Li,
    processProps: props => {
      let i = 0
      Array.isArray(props.children) && props.children.forEach((e) => !e.is && typeof e == 'object' && (e['data-index'] = i++))
      return props
    }
  })

  const _Menu = e => {
    const parent = useContext(MenuCtx)
    const ctx = createMutable({ deep: parent.deep + 1 })
    return (
      <MenuCtx.Provider value={ctx}>
        <div
          {...combineProps({ class: `${props.x && ctx.deep == 1 ? 'tt-menu-x flex' : 'tt-menu max-h-100'} overflow-auto` }, e)}
          use:VDir={e.usedir}
          on:click={e => e.stopPropagation()}
        >
          {(el => isEmpty(el) ? <div class='px-4 py-2 op40'>无内容</div> : el)(e.children)}
        </div>
      </MenuCtx.Provider>
    )
  }

  return <Li {...combineProps({}, props)} is={_Menu} items={null} children={props.items} />
}