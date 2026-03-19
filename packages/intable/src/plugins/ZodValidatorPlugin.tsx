import type { ZodType } from 'zod'
import type { Plugin, TableColumn } from '..'

declare module '../index' {
  interface TableColumn {
    /**
     * Zod schema to validate the edited value for this column.
     *
     * ```ts
     * { id: 'age', zodSchema: z.number().int().min(0).max(150) }
     * ```
     */
    zodSchema?: ZodType<any, any, any>
  }
}

/**
 * ZodValidatorPlugin — three-level validation pipeline for editable cells.
 *
 * Validation runs in order; the first failure short-circuits the rest:
 * 1. `col.zodSchema` — Zod schema declared on the column
 * 2. `col.validator` — per-column custom validator function
 * 3. `props.validator` — table-level validator (passed as a prop to `<Intable>`)
 *
 * ```tsx
 * const cols = [
 *   {
 *     id: 'email',
 *     zodSchema: z.string().email('Invalid email'),
 *     validator: async (value) => {
 *       const taken = await checkEmailTaken(value)
 *       return taken ? 'Email already in use' : true
 *     },
 *   },
 *   { id: 'age', zodSchema: z.coerce.number().int().min(0).max(150) },
 * ]
 * <Intable columns={cols} plugins={[ZodValidatorPlugin]} />
 * ```
 */
export const ZodValidatorPlugin: Plugin = {
  name: 'zod-validator',
  rewriteProps: {
    validator: ({ validator }) => async (value, data, col: TableColumn) => {
      // 1. Zod schema on the column
      const schema = col.zodSchema
      if (schema) {
        const result = schema.safeParse(value)
        if (!result.success) {
          return result.error.issues[0]?.message ?? false
        }
      }

      // 2. Table-level validator
      if (validator) {
        return validator(value, data, col)
      }

      return true
    },
  },
}
