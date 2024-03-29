"use strict"

const axios = require("axios")
const urlJoin = require("url-join")
const semver = require("semver")

/**
 * 获取 npm 包信息
 * @param {*} npmName npm 包名
 * @param {*} registry npm 包的地址
 * @returns
 */
function getNpmInfo(npmName, registry) {
  if (!npmName) return null
  const registryUrl = registry || getDefaultRegistry()
  const npmInfoUrl = urlJoin(registryUrl, npmName)
  return axios
    .get(npmInfoUrl)
    .then((response) => {
      if (response.status === 200) {
        return response.data
      }
      return null
    })
    .catch((err) => {
      return Promise.reject(err)
    })
}

function getDefaultRegistry(isOriginal = false) {
  return isOriginal ? "https://registry.npmjs.org" : "https://registry.npm.taobao.org"
}

/**
 * 获取 npm 包的最新版本
 * @param {*} npmName npm 包名
 * @param {*} registry npm 包的地址
 * @returns
 */
async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry)
  const newVersions = getSemverVersions(baseVersion, versions)
  if (newVersions && newVersions.length > 0) {
    return newVersions[0]
  }
  return null
}

/**
 * 获取 npm 包的版本信息
 * @param {} npmName npm 包名
 * @param {*} registry npm 包的地址
 * @returns
 */
async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry)
  if (data) {
    return Object.keys(data.versions)
  } else {
    return []
  }
}

/**
 * 获取所有满足条件的版本号
 * @param {*} baseVersion 基础版本号
 * @param {*} versions 所有版本号
 * @returns
 */
function getSemverVersions(baseVersion, versions) {
  return versions
    .filter((version) => semver.satisfies(version, `>${baseVersion}`))
    .sort((a, b) => (semver.gt(b, a) ? 1 : -1))
}

/**
 * 获取 npm 包的最新版本
 * @param {*} npmName
 * @param {*} registry
 * @returns
 */
async function getNpmLatestVersion(npmName, registry) {
  let versions = await getNpmVersions(npmName, registry)
  if (versions) {
    return versions.sort((a, b) => semver.gt(b, a))[0]
  }
  return null
}

module.exports = {
  getNpmInfo,
  getNpmVersions,
  getNpmSemverVersion,
  getDefaultRegistry,
  getNpmLatestVersion
}
