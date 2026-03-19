import { useContext } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { type Plugin, type Plugin$0, Ctx } from '../index'
import { useSelector } from '../hooks/useSelector'
import { createLazyMemo } from '@solid-primitives/memo'

// ------------------------------------------------------------
// Module augmentation
// ------------------------------------------------------------

declare module '../index' {
  interface TableProps {
    tree?: {
      /** Field name that holds children rows. Default: `'children'`. */
      children?: string
    }
  }
  interface TableStore {
    tree: ReturnType<typeof useSelector<any[]>>
    /**
     * Lookup map populated as a side-effect of the `data` rewriteProp.
     * Maps each row's rowKey → its tree metadata.
     * Written via createMutable so reads are reactive.
     */
    _treeMeta: Map<any, { depth: number; hasChildren: boolean; parentKey: any }>
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

interface FlattenResult {
  flat: any[]
  meta: Map<any, { depth: number; hasChildren: boolean; parentKey: any }>
}

function flattenTree(
  rows: any[],
  childrenField: string,
  rowKeyField: string,
  isExpand: (key: any) => boolean,
  depth = 0,
  parentKey: any = null,
  flat: any[] = [],
  meta: Map<any, { depth: number; hasChildren: boolean; parentKey: any }> = new Map(),
): FlattenResult {
  for (const row of rows || []) {
    const key = row[rowKeyField]
    const children: any[] = row[childrenField]
    const hasChildren = Array.isArray(children) && children.length > 0
    meta.set(key, { depth, hasChildren, parentKey })
    flat.push(row)
    if (hasChildren && isExpand(key)) {
      flattenTree(children, childrenField, rowKeyField, isExpand, depth + 1, key, flat, meta)
    }
  }
  return { flat, meta }
}

// ------------------------------------------------------------
// Plugin
// ------------------------------------------------------------

export const TreePlugin: Plugin$0 = store => {
  const firstCol = createLazyMemo(() => store.props.columns?.findIndex(e => !e[store.internal]) ?? -1)
  
  return {
    name: 'tree',

    store: (store) => ({
      tree: useSelector({ multiple: true }),
      _treeMeta: new Map(),
    }),

    rewriteProps: {
      tree: ({ tree }) => ({
        children: 'children',
        ...tree,
      }),
      
      /**
       * Flatten nested `children` arrays into a single display list.
       * Simultaneously populates `store._treeMeta` (depth, hasChildren, parentKey)
       * so that `Td` can read tree metadata without a second traversal.
       */
      data: ({ data }, { store }) => {
        if (!store.props?.tree) return data

        const childrenField = store.props.tree.children || 'children'
        const rowKeyField = store.props.rowKey

        const { flat, meta } = flattenTree(
          data,
          childrenField,
          rowKeyField,
          (key) => store.tree.has(key),
        )

        // Reactive write: any context reading store._treeMeta will re-run
        store._treeMeta = meta

        return flat
      },

      /**
       * Render the first non-internal column with indentation and an
       * expand / collapse chevron for rows that have children.
       */
      Td: ({ Td }, { store }) => o => {
        const rowKey = () => store.props.rowKey
        const meta = () => store._treeMeta?.get(o.data?.[rowKey()])

        o = combineProps(o, {
          onDblClick() {
            meta()?.hasChildren && store.tree.toggle(o.data?.[rowKey()])
          },
        })
        
        return (
          <Td {...o}>
            {/* todo */}
            {o.x === firstCol() ? (
              <div class='flex items-center' style={`padding-left: ${meta()?.depth! * 16}px`}>
              {meta()?.hasChildren ? (
                <ILucideChevronRight
                  class='icon-clickable mr-1'
                  style={`transform: rotate(${store.tree.has(o.data?.[rowKey()]) ? 90 : 0}deg); opacity: .6; flex-shrink: 0; transition: transform .15s`}
                  onClick={(e: MouseEvent) => { e.stopPropagation(); store.tree.toggle(o.data?.[rowKey()]) }}
                />
              ) : (
                // Spacer keeps text aligned with sibling rows that do have an icon
                <span style='display: inline-block; width: 16px; flex-shrink: 0; margin-right: 4px' />
              )}
              {o.children}
            </div>
            ) : (
              o.children
            )}
          </Td>
        )
      },
    },

    commands: (store, { addRows }) => ({
      // add to parent children array if adding inside an expanded group, otherwise add to root
      addRows(i, rows, before = true) {
        if (!store.props?.tree) return addRows?.(i, rows, before)

        const { data: flatData, rowKey } = store.props!
        const childrenField = store.props.tree.children || 'children'

        // Skip internal rows – find the nearest real anchor (same logic as base addRows)
        let anchor = flatData[i]
        if (anchor?.[store.internal]) {
          let p: any = null, n: any = null
          for (let j = i - 1; j >= 0; j--) { if (!flatData[j]?.[store.internal]) { p = flatData[j]; break } }
          for (let j = i + 1; j < flatData.length; j++) { if (!flatData[j]?.[store.internal]) { n = flatData[j]; break } }
          anchor = before ? (p || n) : (n || p)
        }

        // No anchor or anchor is at root depth → delegate to base addRows untouched
        if (!anchor) return addRows?.(i, rows, before)
        const anchorKey = anchor[rowKey]
        const meta = store._treeMeta?.get(anchorKey)
        if (!meta || meta.depth === 0) return addRows?.(i, rows, before)

        const parentKey = meta.parentKey

        // Update cell selection to point at the inserted rows
        const anchorFlatIdx = flatData.findIndex((r: any) => r[rowKey] === anchorKey)
        if (anchorFlatIdx >= 0 && store.selected) {
          const insertAt = anchorFlatIdx + (before ? 0 : 1)
          store.selected.start = [0, insertAt]
          store.selected.end = [Infinity, insertAt + rows.length - 1]
        }

        // Splice into the parent's children array (immutably clone up to the splice point)
        const rawData = [...(store.rawProps.data || [])]

        function insertInto(nodes: any[]): boolean {
          for (let j = 0; j < nodes.length; j++) {
            const node = nodes[j]
            if (node[rowKey] === parentKey) {
              const children = [...(node[childrenField] || [])]
              const childIdx = children.findIndex((c: any) => c[rowKey] === anchorKey)
              const at = childIdx >= 0 ? childIdx + (before ? 0 : 1) : children.length
              children.splice(at, 0, ...rows)
              nodes[j] = { ...node, [childrenField]: children }
              return true
            }
            if (Array.isArray(node[childrenField]) && node[childrenField].length) {
              const childrenCopy = [...node[childrenField]]
              if (insertInto(childrenCopy)) {
                nodes[j] = { ...node, [childrenField]: childrenCopy }
                return true
              }
            }
          }
          return false
        }

        insertInto(rawData)

        // Ensure the parent branch is expanded so the new row is visible
        if (!store.tree.has(parentKey)) store.tree.toggle(parentKey)

        store.props?.onDataChange?.(rawData)
      },
    }),
  }
}
