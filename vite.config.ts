import { defineConfig, type Plugin } from 'vite'
import solid from 'vite-plugin-solid'
import path from 'path'

export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
    assetsDir: './',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  plugins: [
    (await import('babel-plugin-solid-undestructure')).undestructurePlugin('ts'), 
    (await import('babel-plugin-solid-undestructure')).undestructurePlugin('vanilla-js'),
    { load: (id) => id.includes('undestructure-macros') ? '' : null },

    solid(),
    
    (await import('unocss/vite')).default({
      content: {
        pipeline: {
          include: ["src/**/*.{js,ts,tsx}"],
        },
      },
      presets: [
        // (await import('@ameinhardt/unocss-preset-daisy')).presetDaisy({ base: true, utils: true, logs: true, styled: true }),
        (await import('unocss/preset-wind4')).default({ dark: 'media', preflights: { reset: false, theme: true } }),
      ],
      transformers: [
        (await import('@unocss/transformer-directives')).default(),
        (await import('unocss')).transformerVariantGroup(),
      ],
      shortcuts: {
        aic: 'items-center',
      },
      // theme: (await import('daisyui/functions/variables.js')).default
    }),
    {
      enforce: 'post',
      transform: (code, id) => /__uno.css(.*?raw)$/.test(id) ? `export default \`${code.replaceAll('\\', '\\\\')}\`` : void 0
    } as Plugin,

    (await import('unplugin-auto-import/vite')).default({
      dts: './src/types/auto-imports.d.ts',
      resolvers: [(await import('unplugin-icons/resolver')).default({ extension: 'jsx', customCollections: ['my'] })]
    }),
    (await import('unplugin-icons/vite')).default({
      autoInstall: true,
      compiler: 'solid',
      customCollections: {
        my: (await import('unplugin-icons/loaders')).FileSystemIconLoader('src/assets')
      }
    }),

    (await import('rollup-plugin-visualizer')).visualizer()
  ],
})
