import z, { symbol } from 'zod'
import { useEffect, useRef, useState, createElement as h, type FC, useMemo } from 'react'

import { Intable, component } from '../../../packages/react/src'
import { AntdPlugin } from '../../../packages/react/src/plugins/antd'
import { DiffPlugin } from '../../../packages/intable/src/plugins/DiffPlugin'
import { ZodValidatorPlugin } from '../../../packages/intable/src/plugins/ZodValidatorPlugin'

export default component(() => {
  const [cols, setCols] = useState([
    {
      id: 'text', name: 'Text (1–5 chars, no reserved)', width: 180, editable: true,
      zodSchema: z.string().min(1, 'Required').max(5, 'Max 5 characters'),
      validator: (value: string) =>
        ['admin', 'root', 'null'].includes(value.toLowerCase()) ? `"${value}" is a reserved word` : true,
    },
    {
      id: 'num', name: 'Number (0–100)', width: 140, editable: true, editor: 'number',
      zodSchema: z.coerce.number({ error: 'Must be a number' }).min(0, 'Min 0').max(100, 'Max 100'),
    },
    { id: 'date', name: 'Date',     width: 130, editable: true, editor: 'date' },
    { id: 'time', name: 'Time',     width: 130, editable: true, editor: 'time' },
    { id: 'datetime', name: 'DateTime',     width: 130, editable: true, editor: 'datetime' },
    { id: 'color', name: 'Color',    width: 100, editable: true, editor: 'color' },
    { id: 'bool', name: 'Checkbox', width: 100, editable: true, editor: 'checkbox' },
    { id: 'switch', name: 'Switch', width: 100, editable: true, editor: 'switch', enum: { true: 'xx' } },
    {
      id: 'select', name: 'Select', width: 120, editable: true, editor: 'select',
      enum: { A: 'Option A', B: 'Option B', C: 'Option C' },
    },
    {
      id: 'select2', name: 'Select2', editable: true, editor: 'select', editorProps: { mode: 'multiple' },
      enum: { A: 'Option A', B: 'Option B', C: 'Option C' },
    },
    { id: 'readonly', name: 'ReadOnly', width: 100 },
  ])

  const [data, setData] = useState([
    { id: 1, text: null, num: 0, date: '2020-10-10', time: '00:00:01', datetime: '2020-10-10 00:00:01', color: '#000', bool: true, switch: true, select: 'A', select2: ['A', 'B'], range: 50, readonly: 'r' },
    { id: 2, text: 'text', num: -1, date: '2020-10-10', color: '555', bool: false, select: 'B', select2: ['A'], range: 50, readonly: 'r' },
    { id: 3, text: 'text1', num: 101, date: '2020-10-10', color: '#444', bool: false, select: 'C', range: 50, readonly: 'r' },
    { id: 4, text: 'text11', num: 0, date: '2020-10-10', color: '#333', bool: false, select: 'A', range: 50, readonly: 'r' },
    { id: 5, text: '', num: 1, date: null, color: '222', bool: false, select: 'A', range: 50, readonly: 'r' },
    { id: 6, text: '', num: 2, date: '', color: '#111', bool: false, select: 'A', range: 50, readonly: 'r' },
  ])

  const diffdata = useMemo(() => {
    const e = [...data]
    e.splice(1, 1, { id: Symbol(), date: '2008-12-12' })
    return e
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
    rowKey: 'id',
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
    plugins: [DiffPlugin, AntdPlugin, ZodValidatorPlugin],
    diff: {
      enable: true,
      data: diffdata
    }
  })
})