import { relative, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const mergeProps2Path = resolve(__dirname, 'mergeProps2.js')

/**
 * Babel plugin for vite-plugin-solid.
 *
 * 1. Replaces `_$mergeProps(...)` / `mergeProps(...)` with `mergeProps2(...)`
 *    inside `rewriteProps.Td` / `rewriteProps.Th` function bodies.
 * 2. Injects `import { mergeProps2 } from '...utils/mergeProps2.js'`.
 */
export default function babelPluginPerfMergeProps({ types: t }) {
  /** @type {string | undefined} */
  let filename

  return {
    name: 'perf-merge-props',
    pre() {
      // filename is set by babel; we need it for relative import path
    },
    visitor: {
      Program(path, state) {
        filename = state.file.opts.filename
      },
      CallExpression(path) {
        const name = path.node.callee.name
        if (name !== '_$mergeProps' && name !== 'mergeProps') return

        let p = path.parentPath
        while (p) {
          if (
            p.isObjectProperty() &&
            (t.isIdentifier(p.node.key, { name: 'Td' }) ||
             t.isIdentifier(p.node.key, { name: 'Th' }))
          ) {
            
            // ── Inject the mergeProps2 import ──────────────────────────
            if (filename && filename.includes('plugins')) {
              path.node.callee.name = 'mergeProps2'
              const program = path.findParent(p => p.isProgram())
              if (program) {
                const body = program.node.body
                // Avoid duplicate imports
                const hasImport = body.some(
                  node =>
                    t.isImportDeclaration(node) &&
                    node.source.value.includes('mergeProps2'),
                )
                if (!hasImport) {
                  let importPath = relative(dirname(filename), mergeProps2Path)
                  if (!importPath.startsWith('.')) importPath = './' + importPath
                  // Insert at position 0 (after any precede-directives)
                  const idx = body.findIndex(n => !t.isImportDeclaration(n) && !t.isStringLiteral(n))
                  body.splice(idx === -1 ? body.length : idx, 0,
                    t.importDeclaration(
                      [t.importSpecifier(t.identifier('mergeProps2'), t.identifier('mergeProps2'))],
                      t.stringLiteral(importPath),
                    ),
                  )
                }
              }
            }

            return
          }
          p = p.parentPath
        }
      },
    },
  }
}
