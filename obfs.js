/*

  OBFS

  File-based, object-oriented data store for Node.js

  Github: https://github.com/jenselg/obfs
  NPM: https://www.npmjs.com/package/obfs

  MIT License

  Copyright (c) 2019 Jensel Gatchalian <jensel.gatchalian@gmail.com>

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

*/

'use strict'

// Node.js Libraries
const _os = require('os')
const _fs = require('fs')
const _path = require('path')
const _crypto = require('crypto')


// OBFS
class OBFS
{
  constructor (args = {})
  {

    //= VARIABLES

        let readData, writeData, delData // FN FS OPS
        let encryptData, decryptData, encryptKey, decryptKey, encryptionInit, encryptionInstance // FN CRYPTO
        let handler = {} // FN OBJECT TRAPS
        let checkPerms, alphaNumSort // FNS
        let init // FN INIT
        let basePath // VAL FOR BASEPATH

    //= START - FN FS OPS

        readData = (dataPath) =>
        { // START readData
          let readContent

          // encryption
          if (this["obfs:encryption"])
          {
            try { readContent = decryptData(_fs.readFileSync(dataPath, this["obfs:encoding"])) }
            catch (err) { readContent = undefined }
          }
          else readContent = _fs.readFileSync(dataPath, this["obfs:encoding"])

          // parse data
          // functions
          if (readContent && (readContent.startsWith('(') || readContent.startsWith('function')))
          {
            if (this["obfs:functions"])
            {
              try { return new Function('"use strict"; return ' + readContent)() }
              catch (err) { return readContent } // return raw on err
            }
            else
            {
              return readContent
            }
          }
          // regular data
          else if (readContent)
          {
            try { return JSON.parse(readContent) }
            catch (err) { return readContent } // return raw on err
          }
          else
          {
            return undefined
          }

        } // END readData

        writeData = (dataPath, dataContent) =>
        { // START writeData

          if (typeof(dataContent) === 'object' && !Array.isArray(dataContent))
          {
            _fs.mkdirSync(dataPath)
            Object.keys(dataContent).forEach((content) =>
            {
              if (!content.startsWith('obfs:')) writeData(_path.resolve(dataPath, content), dataContent[content])
            })
          }
          else if (typeof(dataContent) !== 'undefined')
          {
            if (typeof(dataContent) === 'function') dataContent = '' + dataContent
            else dataContent = JSON.stringify(dataContent)
            if (this["obfs:encryption"]) dataContent = encryptData(dataContent)
            _fs.writeFileSync(dataPath, dataContent)
          }

        } // END writeData

        delData = (dir_path) =>
        { // START delData
          if (_fs.existsSync(dir_path) && _fs.lstatSync(dir_path).isDirectory())
          {
              _fs.readdirSync(dir_path).forEach((entry) =>
              {
                  let entry_path = _path.join(dir_path, entry)
                  if (_fs.lstatSync(entry_path).isDirectory()) { delData(entry_path) }
                  else {  _fs.unlinkSync(entry_path) }
              })
              _fs.rmdirSync(dir_path)
          }
          else if (_fs.existsSync(dir_path) && _fs.lstatSync(dir_path).isFile()) { _fs.unlinkSync(dir_path) }
        } // END delData

    //= END - FN FS OPS

    //= START - FNS

        checkPerms = (ops) =>
        {
          if (ops === 'get')
          {
            if (this["obfs:permissions"] === 'w') throw new Error('OBFS instance is write-only!')
          }
          else if (ops === 'set')
          {
            if (this["obfs:permissions"] === 'r') throw new Error('OBFS instance is read-only!')
          }
          else
          {
            throw new Error('Called checkPerms without an argument!')
          }
        }

        alphaNumSort = (a, b) =>
        {
          let reA = /[^a-zA-Z]/g
          let reN = /[^0-9]/g
          let aA = a.replace(reA, "")
          let bA = b.replace(reA, "")
          if (aA === bA)
          {
            let aN = parseInt(a.replace(reN, ""), 10)
            let bN = parseInt(b.replace(reN, ""), 10)
            return aN === bN ? 0 : aN > bN ? 1 : -1
          }
          else
          {
            return aA > bA ? 1 : -1
          }
        }

    //= END - FNS

    //= START - FN CRYPTO

        encryptData = (data) =>
        { // START encryptData

          encryptKey(encryptionInstance.key, encryptionInstance.keyfile, encryptionInstance.keyLength).forEach((key) =>
          {
            let iv = _crypto.randomBytes(16)
            let cipher = _crypto.createCipheriv(encryptionInstance.algorithm, new Buffer.from(key), iv)
            let encStr = Buffer.concat([cipher.update(data), cipher.final()]).toString('hex')
            data = iv.toString('hex').substring(0, 16) + encStr + iv.toString('hex').substring(16, 32)
            iv = undefined
            cipher = undefined
            encStr = undefined
          })
          return data

        } // END encryptData

        decryptData = (data) =>
        { // START decryptData

          decryptKey(encryptionInstance.key, encryptionInstance.keyfile, encryptionInstance.keyLength).forEach((key) =>
          {
            let iv = new Buffer.from(data.slice(0, 16) + data.slice(-16, data.length), 'hex')
            let decipher = _crypto.createDecipheriv(encryptionInstance.algorithm, new Buffer.from(key), iv)
            let encBuffer = new Buffer.from(data.slice(0, -16).substr(16), 'hex')
            data = Buffer.concat([decipher.update(encBuffer), decipher.final()]).toString()
            iv = undefined
            decipher = undefined
            encBuffer = undefined
          })
          return data

        } // END decryptData

        encryptKey = (key, keyfile, length) =>
        { // START encryptKey

          let keyArr

          if (key && keyfile)
          {
            keyArr = key.split(':').map((val) =>
            {
              switch (length)
              {

                // 256 bit algos
                case 32:
                  return _crypto.createHash('sha256').update(val + keyfile + val).digest()
                  break

                default:
                  // return nothing
              }
            })
          }
          else if (key && !keyfile)
          {
            keyArr = key.split(':').map((val) =>
            {
              switch (length)
              {

                // 256 bit algos
                case 32:
                  return _crypto.createHash('sha256').update(val).digest()
                  break

                default:
                  // return nothing
              }
            })
          }
          else if (!key && keyfile)
          {
            keyArr = [_crypto.createHash('sha256').update(keyfile).digest()]
          }

          return keyArr

        } // END encryptKey

        decryptKey = (key, keyfile, length) =>
        { // START decryptKey

          let keyArr

          if (key && keyfile)
          {
            keyArr = key.split(':').map((val) =>
            {
              switch (length)
              {

                // 256 bit algos
                case 32:
                  return _crypto.createHash('sha256').update(val + keyfile + val).digest()
                  break

                default:
                  // return nothing
              }
            })
          }
          else if (key && !keyfile)
          {
            keyArr = key.split(':').map((val) =>
            {
              switch (length)
              {

                // 256 bit algos
                case 32:
                  return _crypto.createHash('sha256').update(val).digest()
                  break

                default:
                  // return nothing
              }
            })
          }
          else if (!key && keyfile)
          {
            keyArr = [_crypto.createHash('sha256').update(keyfile).digest()]
          }

          return keyArr.reverse()

        } // END decryptKey

        encryptionInit = () =>
        { // START encryptionInit

          encryptionInstance = {}
          encryptionInstance.algorithm = args.encryption.algorithm
          encryptionInstance.key = args.encryption.key ? args.encryption.key : undefined
          encryptionInstance.keyfile = args.encryption.keyfile ? _fs.readFileSync(_path.resolve(args.encryption.keyfile), this["obfs:encoding"]).split('\n').filter(Boolean).join('') : undefined
          encryptionInstance.valid = false

          // accepted algos and assign key length
          switch (encryptionInstance.algorithm)
          {

            // 256 bit algos
            case 'aes256':
            case 'aria256':
            case 'camellia256':
              encryptionInstance.keyLength = 32
              if (encryptionInstance.key || encryptionInstance.keyfile)
              {
                encryptionInstance.valid = true
              }
              break

            // invalid algo
            default:
              throw new Error('Invalid encryption algorithm!') // silent fail

          }

          // return status
          return encryptionInstance.valid

        } // END encryptionInit

    //= END - FN CRYPTO

    //= START - FN OBJECT TRAPS

        handler.get = (target, key) =>
        { // START handler.get

          if (typeof(target) === 'object' && !Array.isArray(target)) // check if target is an actual object
          {

            if (typeof(key) !== 'symbol' && key.startsWith('obfs:')) // special property
            {
              let objKey = key
              let targetPath = _path.resolve(basePath, ...target["obfs:name"].split(':'))
              switch (objKey)
              {
                case 'obfs:name':
                  return target["obfs:name"]
                  break
                case 'obfs:path':
                  return targetPath
                  break
                case 'obfs:keys':
                  let keysArr = []
                  try
                  {
                    _fs.readdirSync(targetPath, { encoding: this["obfs:encoding"] }).forEach((key) =>
                    {
                      if (!key.startsWith('.')) keysArr.push(key)
                    })
                  } catch (err) {}
                  return keysArr.sort(alphaNumSort)
                  break
                case 'obfs:timestamp':
                  let ts
                  try { ts = _fs.statSync(targetPath).mtime }
                  catch (err) { ts = null }
                  return ts
                  break
                default:
                  return undefined
              }
            }
            else if (typeof(key) !== 'symbol') // regular get
            {
              if (typeof(key) === 'number') key = key.toString() // convert to string because invalid key/JSON

              // instance object
              let obj = {}
              obj["obfs:name"] = target["obfs:name"] + ':' + key
              obj["obfs:path"] = _path.resolve(basePath, ...target["obfs:name"].split(':'), key)
              obj["obfs:keys"] = []
              obj["obfs:timestamp"] = null

              // key is a file
              if (_fs.existsSync(obj["obfs:path"]) && _fs.lstatSync(obj["obfs:path"]).isFile())
              {
                checkPerms('get') // check permissions
                return readData(obj["obfs:path"])
              }
              // key is a directory
              else if (_fs.existsSync(obj["obfs:path"]) && _fs.lstatSync(obj["obfs:path"]).isDirectory())
              {
                _fs.readdirSync(obj["obfs:path"], { encoding: this["obfs:encoding"] }).forEach((key) =>
                {
                  obj["obfs:keys"].push(key)
                })
                obj["obfs:keys"] = obj["obfs:keys"].sort(alphaNumSort)
                obj["obfs:timestamp"] = _fs.statSync(obj["obfs:path"]).mtime
                return new Proxy(obj, handler)
              }
              // key is neither, return object for unlimited recursion
              else
              {
                return new Proxy(obj, handler)
              }
            }

          }

        } // END handler.get

        handler.set = (target, key, value) =>
        { // START handler.set

          // if target is an actual object
          if (typeof(target) === 'object' && !Array.isArray(target))
          {

            checkPerms('set') // check permissions

            // create folders if they dont exist
            let curPath = _path.resolve(basePath)
            target["obfs:name"].split(':').forEach((pathName) =>
            {
              curPath = _path.resolve(curPath, pathName)
              if (!_fs.existsSync(curPath))
              { _fs.mkdirSync(curPath) }
              else if (_fs.existsSync(curPath) && _fs.lstatSync(curPath).isFile())
              {
                _fs.unlinkSync(curPath)
                _fs.mkdirSync(curPath)
              }
            })

            // define keypath
            let keyPath = _path.resolve(curPath, key)

            // delete existing
            if (_fs.existsSync(keyPath)) delData(keyPath)

            if (value === undefined || value === null)
            {
              delData(keyPath)
              if (target["obfs:keys"].indexOf(key) >= 0) target["obfs:keys"] = target["obfs:keys"].filter(val => val !== key).sort(alphaNumSort)
              delete target[key]
            }
            else if (!key.startsWith('obfs:'))
            {
              writeData(keyPath, value)
              if (target["obfs:keys"].indexOf(key) === -1) target["obfs:keys"] = target["obfs:keys"].concat(key).sort(alphaNumSort)
            }

          }

        } // END handler.set

    //= END - FN OBJECT TRAPS

    //= START - OBFS INIT

      /*

        OPTIONS:
        args.path = ''// string
        args.name = ''// string
        args.encoding = '' // string
        args.permissions = ''// string
        args.functions = boolean
        args.encryption = { algorithm: '', keys: ':::...', keyfile: '/path/to/key' } // object

      */

        init = () =>
        { // START init

            try { // catch errors for instance creation at specified path and name

              // 🐇 - use custom path
              if (args.path)
              {
                args.path = _path.resolve(args.path)
                if (!_fs.existsSync(args.path)) { _fs.mkdirSync(args.path) }
              }

              // 🐇 - use home path
              else
              {
                args.path = _os.homedir()
              }

              // 🐇 - use custom OBFS name
              if (args.name)
              {
                if (!_fs.existsSync(_path.resolve(args.path, args.name))) { _fs.mkdirSync(_path.resolve(args.path, args.name)) }
              }

              // 🐇 - use default OBFS name
              else
              {
                args.name = 'obfs'
                if (!_fs.existsSync(_path.resolve(args.path, args.name))) { _fs.mkdirSync(_path.resolve(args.path, args.name)) }
              }

            }
            catch (err) { throw new Error('Failed to create instance at specified path and name! Make sure the path is valid and correct filesystem permissions at specified path and name.') }

            // 🐇 - define relative path
            this["obfs:name"] = args.name

            // 🐇 - define fspath
            this["obfs:path"] = _path.resolve(args.path, args.name)
            basePath = _path.resolve(args.path)

            // 🐇 - define encoding
            this["obfs:encoding"] = args.encoding ? args.encoding : 'utf8'

            // 🐇 - define permissions
            this["obfs:permissions"] = args.permissions && ['r', 'w', 'rw'].indexOf(args.permissions) >= 0 ? args.permissions : 'rw'

            // 🐇 - define fn evaluation
            this["obfs:functions"] = args.functions && typeof(args.functions) === 'boolean' ? args.functions : false

            // 🐇 - define encryption
            if (typeof(args.encryption) === 'object' && args.encryption.algorithm)
            {
              if (args.encryption.key || args.encryption.keyfile)
              {
                this["obfs:encryption"] = encryptionInit()
              }
              else
              {
                this["obfs:encryption"] = false
              }
            }
            else
            {
              this["obfs:encryption"] = false
            }

            // 🐇 - check instance encryption
            if (this["obfs:encryption"]) // encrypted instance
            {

              // define payload
              let encPayload = ''
              if (encryptionInstance.key) encPayload += encryptionInstance.key
              if (encryptionInstance.keyfile) encPayload +=  encryptionInstance.keyfile
              encPayload = _crypto.createHash('sha256').update(encPayload).digest().toString('hex')
              // encrypt a non-encrypted instance
              if (!_fs.existsSync(_path.resolve(args.path, args.name, '.secure')))
              {
                _fs.writeFileSync(_path.resolve(args.path, args.name, '.secure'), encryptData(encPayload))
                encPayload = undefined // clear from memory
              }
              // check if provided encryption keys match with the encrypted instance
              else
              {
                try { decryptData(_fs.readFileSync(_path.resolve(args.path, args.name, '.secure'), this["obfs:encoding"])) }
                catch (err) { throw new Error('Encrypted instance key(s) and/or algorithm mismatch!') }
              }

            }
            else // unencrypted instance
            {
              // data store is encrypted
              if (_fs.existsSync(_path.resolve(args.path, args.name, '.secure')))
              {
                throw new Error('Cannot start unencrypted instance on an encrypted data store!')
              }
            }

            this["obfs:keys"] = []
            _fs.readdirSync(_path.resolve(args.path, args.name), { encoding: this["obfs:encoding"] }).forEach((key) =>
            {
              if (!key.startsWith('.')) this["obfs:keys"].push(key)
            })

            this["obfs:timestamp"] = _fs.statSync(this["obfs:path"]).mtime

            // down the rabbit hole we go...
            return true

        } // END init

        // 💊 - take the red pill...
        if (init()) { return new Proxy(this, handler) }
        // 💊 - take the blue pill...
        else { return undefined }

    //= END - OBFS INIT

  }
}

// Follow the _path...
module.exports = OBFS
