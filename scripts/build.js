import { resolve, join, dirname, relative, extname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, readdirSync, existsSync, rmSync, cpSync, writeFileSync } from 'fs'
import { build } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const packagesDir = resolve(rootDir, 'packages')

// 获取所有包目录
function getPackages() {
  const packages = []
  const dirs = readdirSync(packagesDir)

  for (const dir of dirs) {
    const packagePath = join(packagesDir, dir)
    const packageJsonPath = join(packagePath, 'package.json')

    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      packages.push({
        name: packageJson.name || dir,
        path: packagePath,
        packageJson,
      })
    }
  }

  return packages
}

// 构建单个包
async function buildPackage(pkg) {
  console.log(`\n📦 Building ${pkg.name}...`)

  const distPath = join(pkg.path, 'dist')

  try {
    await build({
      configFile: process.cwd() + '/vite.config.ts',
      root: pkg.path,
      build: {
        outDir: 'dist',
        lib: {
          // preserve modules
          entry: Object.fromEntries(readdirSync(join(pkg.path, 'src'), { withFileTypes: false, recursive: true }).filter(e => /\.[tj]sx?$/.test(e)).map(e => [
            e.slice(0, e.length - extname(e).length),
            join('src', e)
          ])),
          formats: ['es'],
          cssFileName: 'style',
        },
        rollupOptions: {
          external: id => {
            // 排除所有外部依赖
            const externals = Object.keys({
              ...pkg.packageJson.dependencies,
              ...pkg.packageJson.devDependencies,
              ...pkg.packageJson.peerDependencies,
            })

            // 排除特定的外部依赖
            return externals.some(ext => id === ext || id.startsWith(ext + '/'))
          },
          output: {
            preserveModules: true,
            // preserveModulesRoot: join(pkg.path, 'src'),
            // entryFileNames: '[name].js',
            // entryFileNames: m => m.moduleIds.some(e => e.includes('node_modules')) ? 'vendor.js' : m.name + '.js',
            advancedChunks: {
              groups: [
                { name: (id) => id.includes('node_modules') ? 'vendor' : null },
              ],
            }
          },
        },
        sourcemap: false,
        minify: true,
        emptyOutDir: true,
      },
      plugins: [
        (await import('vite-plugin-lib-inject-css')).libInjectCss()
      ]
    })

    // // 复制 style.scss 文件
    // const stylePath = join(pkg.path, 'src/style.scss')
    // if (existsSync(stylePath)) {
    //   cpSync(stylePath, join(distPath, 'style.scss'))
    //   console.log('  ✓ Copied style.scss')
    // }

    if (existsSync(join(pkg.path, 'src/theme'))) {
      cpSync(join(pkg.path, 'src/theme'), join(distPath, 'theme'), { recursive: true })
    }

    // fix: unocss
    if (existsSync(join(pkg.path, 'dist/__uno.css'))) {
      const uno = readFileSync(join(pkg.path, 'dist/__uno.css'), { encoding: 'utf8' })
      const rewrite = (path, fn) => writeFileSync(path, fn(readFileSync(path, { encoding: 'utf8' })))
      rewrite(join(pkg.path, 'dist/style.css'), str => uno + '\n' + str)
      rewrite(join(pkg.path, 'dist/index.js'), str => str.replace(`import './__uno.css'`, ''))
    }


    console.log(`✅ ${pkg.name} built successfully!`)

    await genDts(pkg.path)
  } catch (error) {
    console.error(`❌ Failed to build ${pkg.name}:`, error)
    throw error
  }
}

// 使用 tsc 生成类型定义（跳过错误）
async function genDts(cwd) {
  console.log('  📝 Generating TypeScript declarations...')
  try {
    const distPath = join(cwd, 'dist')
    const { execSync } = await import('child_process')
    const { writeFileSync } = await import('fs')

    // 创建临时 tsconfig 用于生成类型定义
    const tempTsConfig = {
      extends: './tsconfig.app.json',
      compilerOptions: {
        declaration: true,
        emitDeclarationOnly: true,
        noEmit: false,
        outDir: distPath,
        skipLibCheck: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        jsx: 'preserve',
        jsxImportSource: 'solid-js',
      },
      include: ['src'],
    }

    const tempConfigPath = join(cwd, 'tsconfig.dts.json')
    writeFileSync(tempConfigPath, JSON.stringify(tempTsConfig, null, 2))

    try {
      execSync(`pnpm exec tsc --project tsconfig.dts.json --skipLibCheck --noCheck`, { cwd, stdio: 'pipe' })
    } catch (tscExecError) {
      // 即使有错误也尝试查找生成的文件
      const dtsFiles = readdirSync(distPath, { recursive: true }).filter(f => f.endsWith('.d.ts'))
      if (dtsFiles.length > 0) {
        console.log(`  ℹ Generated ${dtsFiles.length} declaration files (with some errors)`)
      } else {
        throw tscExecError
      }
    }

    // 删除临时配置文件
    rmSync(tempConfigPath, { force: true })

    console.log('  ✓ TypeScript declarations generated')
  } catch (tscError) {
    console.log('  ⚠ TypeScript declarations skipped')
    // 不抛出错误，允许构建继续
  }
}

// 主函数
async function main() {
  console.log('🚀 Starting package build process...\n')

  const packages = getPackages()
  console.log(`Found ${packages.length} package(s):`, packages.map(p => p.name).join(', '))

  // 依次构建每个包
  for (const pkg of packages) {
    await buildPackage(pkg)
  }

  console.log('\n✨ All packages built successfully!')
}

// 执行构建
main().catch(error => {
  console.error('Build failed:', error)
  process.exit(1)
})
