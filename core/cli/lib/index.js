"use strict"

module.exports = core

const log = require("@xiaoye-cli/log")
const path = require("path")
const semver = require("semver")
const colors = require("colors/safe")
const userHome = require("user-home")
const pathExists = require("path-exists").sync

const DEFAULT_CLI_HOME = ".xiaoye-cli"
const pkg = require("../package.json")

async function core() {
  try {
    console.log("core lib")
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkEnv()
    await checkGlobalUpdate()
  } catch (e) {
    log.error(e.message)
    log.error("cli", "xiaoye-cli 检查失败")
  }
}

/** 检查版本号 */
function checkPkgVersion() {
  log.info("cli", pkg.version)
}

/** 检查 Node 版本 */
function checkNodeVersion() {
  const currentVersion = process.version
  const lowestVersion = pkg.engines.node
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(colors.red(`xiaoye-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`))
  }
}

/** 检查 root 用户, 避免以 root 用户运行 */
function checkRoot() {
  const rootCheck = require("root-check")
  rootCheck()
  log.info(process.getuid())
}

/** 检查用户主目录 */
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red("当前登录用户主目录不存在！"))
  }
}

/** 检查环境变量 */
function checkEnv() {
  const dotenv = require("dotenv")
  const dotenvPath = path.resolve(userHome, ".env") // userHome=/Users/zhangzhengyang/
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath
    })
  }
  createDefaultConfig()
  log.info("cli", process.env.CLI_HOME_PATH)
}

/** 创建默认配置 */
function createDefaultConfig() {
  const cliConfig = {
    home: userHome
  }
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig["cliHome"] = path.join(userHome, DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome
}

/** 检查全局更新 */
async function checkGlobalUpdate() {
  // 1. 获取当前版本号和模块名
  // 2. 调用 npm API，获取所有版本号
  // 3. 提取所有版本号，比对哪些版本号是大于当前版本号
  // 4. 获取最新的版本号，提示用户更新到该版本
  const currentVersion = pkg.version
  const npmName = pkg.name
  const { getNpmSemverVersion } = require("@xiaoye-cli/get-npm-info")
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      colors.yellow(
        `请手动更新 ${npmName}，当前版本：${currentVersion}，
        最新版本：${lastVersion} 更新命令： npm install -g ${npmName}`
      )
    )
  }
}
