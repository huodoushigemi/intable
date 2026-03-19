import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const packagesDir = resolve(rootDir, 'packages')

// 获取根目录的版本号
function getRootVersion() {
  const rootPackageJsonPath = join(rootDir, 'package.json')
  const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf-8'))
  return rootPackageJson.version
}

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
        packageJsonPath
      })
    }
  }

  return packages
}

// 同步版本号到子包
function syncVersion(packages, version) {
  console.log(`\n🔄 Syncing version ${version} to all packages...`)
  
  for (const pkg of packages) {
    if (pkg.packageJson.version !== version) {
      pkg.packageJson.version = version
      writeFileSync(pkg.packageJsonPath, JSON.stringify(pkg.packageJson, null, 2))
      console.log(`  ✅ Updated ${pkg.name} to version ${version}`)
    } else {
      console.log(`  ℹ ${pkg.name} already at version ${version}`)
    }
  }
}

// 发布子包
function publishPackage(pkg) {
  console.log(`\n📤 Publishing ${pkg.name}...`)
  
  try {
    execSync(`pnpm publish --no-git-checks --filter ${pkg.name}`, { cwd: rootDir, stdio: 'inherit' })
    console.log(`  ✅ ${pkg.name} published successfully!`)
  } catch (error) {
    console.error(`  ❌ Failed to publish ${pkg.name}:`, error.message)
    throw error
  }
}

// 主函数
async function main() {
  console.log('🚀 Starting publish process...\n')

  // 获取根目录版本号
  const version = getRootVersion()
  console.log(`Root version: ${version}`)

  // 获取所有子包
  const packages = getPackages()
  console.log(`Found ${packages.length} package(s):`, packages.map(p => p.name).join(', '))

  // 同步版本号
  syncVersion(packages, version)

  // 依次发布每个子包
  for (const pkg of packages) {
    await publishPackage(pkg)
  }

  console.log('\n✨ All packages published successfully!')
}

// 执行发布
main().catch(error => {
  console.error('Publish failed:', error)
  process.exit(1)
})
