import { build } from 'vite'
import fs from 'fs'
import path from 'path'

build({
  build: {
    outDir: 'dist',
    minify: true,
    lib: {
      entry: {
        index: 'src/index.tsx',
        ...Object.fromEntries(flatdir('src/plugins').map(e => [e.replace('src/', '').replace('.tsx', ''), e]))
      },
      formats: ['es']
    },
  }
})

function flatdir(dir) {
  let files = fs.readdirSync(dir, { withFileTypes: false, recursive: true })
  files = files.filter(e => /\.[tj]sx?$/.test(e))
  files = files.map(e => path.join(dir, e).replaceAll('\\', '/'))
  return files
}
