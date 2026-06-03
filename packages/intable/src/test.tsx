import { createContext, createMemo, createSignal, For, useContext, createEffect, type JSX, type Component, createComputed, onMount, mergeProps, mapArray, onCleanup, getOwner, runWithOwner, on, untrack, batch, Index, $PROXY, type Owner, createRenderEffect } from 'solid-js'
import { createMutable, reconcile } from 'solid-js/store'
import { combineProps } from '@solid-primitives/props'
import { createLazyMemo } from '@solid-primitives/memo'
import { createElementSize, createResizeObserver, makeResizeObserver } from '@solid-primitives/resize-observer'
import { createScrollPosition } from '@solid-primitives/scroll'
import { difference, isEqual, memoize, sumBy, uniq } from 'es-toolkit'
import { renderComponent, solidComponent } from './components/utils'
import { log, unFn } from './utils'

import 'virtual:uno.css'
import './style.scss'

// import { RenderPlugin } from './plugins/RenderPlugin'
// console.log(RenderPlugin)

export const TestTable = (props) => {
  return <table>
    <thead>
      <tr>
        <For each={props.columns}>{o => (
          <th>{o.name}</th>
        )}</For>
      </tr>
    </thead>
    <thead>
      <For each={props.data}>{(row, rowi) => (
        <tr y={rowi()} data={row}>
          <For each={props.columns}>{(col, coli) => (
            <td x={coli()} y={rowi()} data={row}>{row[col.id]}</td>
          )}</For>
        </tr>
      )}</For>
    </thead>
  </table>
}