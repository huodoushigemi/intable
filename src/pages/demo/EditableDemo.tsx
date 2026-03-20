import { z } from 'zod'
import { createMutable } from 'solid-js/store'
import { Intable } from '../../../packages/intable/src'
import { ZodValidatorPlugin } from '../../../packages/intable/src/plugins/ZodValidatorPlugin'
import { makeData, replaceArray } from './helpers'

const RESERVED = ['admin', 'root', 'null']

const cols = createMutable([
  {
    id: 'col_0', name: 'Text (1–20 chars, no reserved)', width: 180, editable: true,
    zodSchema: z.string().min(1, 'Required').max(20, 'Max 20 characters'),
    validator: (value: string) =>
      RESERVED.includes(value.toLowerCase()) ? `"${value}" is a reserved word` : true,
  },
  {
    id: 'col_1', name: 'Number (0–100)', width: 140, editable: true, editor: 'number',
    zodSchema: z.coerce.number({ error: 'Must be a number' }).min(0, 'Min 0').max(100, 'Max 100'),
  },
  { id: 'col_2', name: 'Date',     width: 130, editable: true, editor: 'date' },
  { id: 'col_3', name: 'Color',    width: 100, editable: true, editor: 'color' },
  { id: 'col_4', name: 'Checkbox', width: 100, editable: true, editor: 'checkbox' },
  {
    id: 'col_5', name: 'Select', width: 120, editable: true, editor: 'select',
    enum: { A: 'Option A', B: 'Option B', C: 'Option C' },
  },
  { id: 'col_6', name: 'Range',    width: 120, editable: true, editor: 'range' },
  { id: 'col_7', name: 'ReadOnly', width: 100 },
] as any[])

const data = makeData(20, 8)

/**
 * Double-click (or start typing) on an editable cell to enter edit mode.
 * Press Enter or click outside to commit. Escape to cancel.
 *
 * Validation:
 *  - Text:   Zod min/max length + col.validator blocks reserved words
 *  - Number: Zod coerce + range 0–100
 *  - Table-level validator: blocks any value containing "error"
 */
export const EditableDemo = () => (
  <Intable
    class='w-full h-60vh'
    columns={cols}
    onColumnsChange={v => replaceArray(cols, v)}
    data={data}
    onDataChange={v => replaceArray(data, v)}
    index
    border
    stickyHeader
    size='small'
    plugins={[ZodValidatorPlugin]}
    validator={(value) =>
      String(value ?? '').toLowerCase().includes('error') ? 'Value must not contain "error"' : true
    }
  />
)
