"use strict"

module.exports = core

const log = require("@xiaoye-cli/log")
const path = require("path")
const semver = require("semver")
const colors = require("colors/safe")
const userHome = require("user-home")
const pathExists = require("path-exists").sync
const commander = require("commander")

const DEFAULT_CLI_HOME = ".xiaoye-cli"
const pkg = require("../package.json")
const program = new commander.Command()

async function core() {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkEnv()
    // await checkGlobalUpdate()
    registerCommand()
  } catch (e) {
    log.error("出现错误", e.message)
  }
}

/** 检查版本号 */
function checkPkgVersion() {
  // log.info("cli", pkg.version)
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
  // log.info(process.getuid())
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
  // log.info("cli", process.env.CLI_HOME_PATH)
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

/**
 * 注册命令
 */
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0]) // 脚手架的名称
    .usage("<command> [options]")
    .version(pkg.version) // 脚手架版本号
    .option("-d, --debug", "是否开启调试模式", false) // 是否开启调试模式
    .option("-tp, --targetPath <targetPath>", "是否指定本地调试文件路径", "") // 是否指定本地调试文件路径

  // program.command("init [projectName]").option("-f, --force", "是否强制初始化项目").action(exec)

  // program
  //   .command("publish")
  //   .option("--refreshServer", "强制更新远程Git仓库")
  //   .option("--refreshToken", "强制更新远程仓库token")
  //   .option("--refreshOwner", "强制更新远程仓库类型")
  //   .action(exec)

  // 监听 debug 模式
  program.on("option:debug", function () {
    if (program.debug) {
      process.env.LOG_LEVEL = "verbose"
      log.info("开启 debug 模式")
    } else {
      process.env.LOG_LEVEL = "info"
    }
    log.level = process.env.LOG_LEVEL
  })

  // // 指定targetPath
  program.on("option:targetPath", function () {
    process.env.CLI_TARGET_PATH = program.targetPath
  })

  // 对未知命令监听 xiaoye-cli test
  program.on("command:*", function (obj) {
    const availableCommands = program.commands.map((cmd) => cmd.name())
    console.log(colors.red("未知的命令：" + obj[0]))
    if (availableCommands.length > 0) {
      console.log(colors.red("可用命令：" + availableCommands.join(",")))
    }
  })

  program.parse(process.argv)

  if (program.args && program.args.length < 1) {
    program.outputHelp() // 如果没有输入命令，输出帮助信息
  }
}
