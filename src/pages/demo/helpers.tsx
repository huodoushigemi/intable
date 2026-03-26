/**
 * Shared helpers for demo data generation.
 */
import { createMutable } from 'solid-js/store'
import { batch } from 'solid-js'
import { range } from 'es-toolkit'

/** Generate flat tabular data */
export function makeData(rows: number, colCount: number) {
  const colIds = range(colCount).map(i => 'col_' + i)
  return createMutable(
    range(rows).map((_, i) =>
      Object.fromEntries([
        ['id', i],
        ...colIds.map(id => [id, `${id}_${i + 1}`]),
      ]),
    ),
  )
}

/** Generate column definitions */
export function makeCols(count: number, extra?: Partial<{ width: number; editable: boolean }>) {
  return createMutable(
    range(count).map(i => ({
      id: 'col_' + i,
      name: 'Col ' + i,
      width: 100,
      ...extra,
    })),
  )
}

/** Shortcut for batch-replacing a reactive array */
export function replaceArray<T>(arr: T[], next: T[]) {
  batch(() => {
    arr.length = 0
    arr.push(...next)
  })
}

export default () => {}