/* MIT License
 *
 * Copyright (c) 2016 schreiben
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict"


const os = require('os')
const zlib = require('zlib')
const tar = require('tar-fs')
const process = require('process')
const request = require('request')
const ProgressBar = require('progress')
const java = require("./../../src/java")

const major_version = '8'
const update_number = '131'
const build_number = '11'
const hash = 'd54c1d3a095b4ff2b6607d096fa80163'
const version = major_version + 'u' + update_number

const jreDirname = `jre1.${major_version}.0_${update_number}`


const fail = reason => {
  console.error(reason)
  process.exit(1)
}

let _arch = os.arch()
switch (_arch) {
  case 'x64':
    break
  case 'ia32':
    _arch = 'i586'
    break
  default:
    fail('unsupported architecture: ' + _arch)
}

const arch = () => _arch

let _platform = os.platform()
let _driver
switch (_platform) {
  case 'darwin':
    _platform = 'macosx'
    _driver = ['Contents', 'Home', 'bin', 'java']
    break
  case 'win32':
    _platform = 'windows'
    _driver = ['bin', 'javaw.exe']
    break
  case 'linux':
    _driver = ['bin', 'java']
    break
  default:
    fail('unsupported platform: ' + _platform)
}

const platform = () => _platform

const url = () =>
  'https://download.oracle.com/otn-pub/java/jdk/' +
  version + '-b' + build_number + '/' + hash +
  '/jre-' + version + '-' + platform() + '-' + arch() + '.tar.gz'

const install = (platform, installDir) => new Promise((resolve, reject) => {

  const urlStr = url()

  console.log("Downloading from: ", urlStr)
  console.log('Installing to', installDir)

  request
    .get({
      url: url(),
      rejectUnauthorized: false,
      agent: false,
      headers: {
        connection: 'keep-alive',
        'Cookie': 'gpw_e24=http://www.oracle.com/; oraclelicense=accept-securebackup-cookie',
      },
    })
    .on('response', res => {
      const len = parseInt(res.headers['content-length'], 10)
      const bar = new ProgressBar('  Downloading and preparing JRE [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 80,
        total: len,
      })
      res.on('data', chunk => bar.tick(chunk.length))
    })
    .on('error', err => {
      console.error(`Problem with request: ${err.message}`)
      return reject(err)
    })
    .on('end', () => {
      return resolve({
        binPath: java.pathToJavaExecutable(installDir, jreDirname, platform),
      })
    })
    .pipe(zlib.createUnzip())
    .pipe(tar.extract(installDir))
})

module.exports = {
  install,
  url,
  jreDirname,

}

