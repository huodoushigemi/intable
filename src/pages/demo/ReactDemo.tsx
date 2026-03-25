import { useEffect, useRef, useState, createElement as h, type FC } from 'react'

import { Intable, component } from '../../../packages/react/src'
import { range } from 'es-toolkit'
import { DiffPlugin } from '../../../packages/intable/src/plugins/DiffPlugin'

export const ReactDemo = component(() => {
  const [cols, setCols] = useState([
    { id: 'col_0', name: 'Column 1', width: 120, editable: true },
    { name: 'HeaderGroup', children: [
      // { id: 'col_1', name: 'Column 2', width: 120, editable: true, render: (props) => h('div', { style: { color: 'red' } }, props.data[props.col.id]) },
      { id: 'col_2', name: 'Column 3', width: 120, editable: true },
    ] },
    { id: 'col_3', name: 'Column 4', width: 120, editable: true },
    { id: 'col_4', name: 'Column 5', width: 120, editable: true },
    { id: 'col_5', name: 'Column 6', width: 120, editable: true },
    { id: 'col_6', name: 'Column 7', editable: true },
    { id: 'col_7', name: 'Column 8', editable: true },
  ])

  const [data, setData] = useState(range(20).map(i => {
    const row: Record<string, any> = { id: i }
    for (let j = 0; j < cols.length; j++) {
      row['col_' + j] = `col_${j}_${i + 1}`
    }
    return row
  }))

  const [xx, setXx] = useState([])
  useEffect(() => {
    setTimeout(() => {
      setXx([])
    }, 2000);
  }, [])
  
  return h(Intable, {
    className: 'w-full h-60vh',
    columns: cols,
    onColumnsChange: v => setCols(v),
    data: data,
    onDataChange: v => setData(v),
    index: true,
    border: true,
    stickyHeader: true,
    size: 'small',
    // 
    resizable: { col: { enable: true }, row: { enable: true } },
    // 
    colDrag: true,
    rowDrag: true,
    rowKey: 'col_0',
    // 
    rowSelection: {
      enable: true,
      multiple: true,
      onChange: (selected) => console.log('selected:', selected),
    },
    expand: {
      enable: true,
      render: ({ data }) => (
        h('div', { className: 'p-3 bg-gray-50 text-sm' }, [
          h('b', { key: 1 }, 'Row Detail:'),
          h('pre', { key: 2, className: 'mt-1' }, JSON.stringify(data, null, 2))
        ])
      )
    },
    plugins: [DiffPlugin],
    diff: {
      enable: true,
      data: (e => {
        e.splice(1, 1, { col_0: 'xxx', col_1: '123' })
        return e
      })([...data])
    }
  })
})