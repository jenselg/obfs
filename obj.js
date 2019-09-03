/*

  Obj.js

  File-based, object-oriented data store for Node.js

  Github: https://github.com/jenselg/obj.js
  NPM: https://www.npmjs.com/package/@jenselg/obj.js

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


// Obj.js Code
class Obj
{
  constructor (args = {})
  {

    //= VARIABLES

        let readData, writeData, delData // FN FS OPS
        let encryptData, decryptData, encryptKey, decryptKey, encryptionInit, encryptionInstance // FN CRYPTO
        let handler = {} // FN OBJECT TRAPS
        let checkPerms // FN PERMISSIONS
        let init // FN INIT
        let basePath // VAL FOR BASEPATH

    //= START - FN FS OPS

        readData = (dataPath) =>
        { // START readData
          let readContent
          if (this["_encryption"]) readContent = decryptData(_fs.readFileSync(dataPath, this["_encoding"]))
          else readContent = _fs.readFileSync(dataPath, this["_encoding"])

          if (readContent.startsWith('(') || readContent.startsWith('function'))
          {
            return new Function('"use strict"; return ' + readContent)()
          }
          else
          {
            try { return JSON.parse(readContent) }
            catch (err) { return readContent }
          }

        } // END readData

        writeData = (dataPath, dataContent) =>
        { // START writeData

          if (typeof(dataContent) === 'object' && !Array.isArray(dataContent))
          {
            _fs.mkdirSync(dataPath)
            Object.keys(dataContent).forEach((content) =>
            {
              if (!content.startsWith('_')) writeData(_path.resolve(dataPath, content), dataContent[content])
            })
          }
          else if (typeof(dataContent) !== 'undefined')
          {
            if (typeof(dataContent) === 'function') dataContent = '' + dataContent
            else dataContent = JSON.stringify(dataContent)
            if (this["_encryption"]) dataContent = encryptData(dataContent)
            _fs.writeFileSync(dataPath, dataContent)
          }

        } // END writeData

        delData = (dir_path) =>
        { // START delData
          if (_fs.existsSync(dir_path) && _fs.lstatSync(dir_path).isDirectory()) {
              _fs.readdirSync(dir_path).forEach(function(entry) {
                  var entry_path = _path.join(dir_path, entry);
                  if (_fs.lstatSync(entry_path).isDirectory()) {
                      delData(entry_path);
                  } else {
                      _fs.unlinkSync(entry_path);
                  }
              });
              _fs.rmdirSync(dir_path);
          } else if (_fs.existsSync(dir_path) && _fs.lstatSync(dir_path).isFile()) {
            _fs.unlinkSync(dir_path)
          }
        } // END delData

    //= END - FN FS OPS

    //= START - FN PERMISSIONS

        checkPerms = (ops) =>
        {
          if (ops === 'get')
          {
            if (this._permissions === 'w') throw new Error('Obj.js instance is write-only!')
          }
          else if (ops === 'set')
          {
            if (this._permissions === 'r') throw new Error('Obj.js instance is read-only!')
          }
          else
          {
            throw new Error('Called checkPerms without an argument!')
          }
        }

    //= END - FN PERMISSIONS

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
          encryptionInstance.keyfile = args.encryption.keyfile ? _fs.readFileSync(_path.resolve(args.encryption.keyfile), this["_encoding"]).split('\n').filter(Boolean).join('') : undefined
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

            if (typeof(key) !== 'symbol' && key.startsWith('_')) // special property
            {
              let objKey = key
              switch (objKey)
              {
                case '_name':
                  return target["_name"]
                  break
                case '_path':
                  return _path.resolve(basePath, ...target["_name"].split(':'))
                  break
                case '_keys':
                  let keysArr = []
                  let targetPath = _path.resolve(basePath, ...target["_name"].split(':'))
                  _fs.readdirSync(targetPath, { encoding: 'utf8' }).forEach((key) =>
                  {
                    keysArr.push(key)
                  })
                  return keysArr
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
              obj["_name"] = target["_name"] + ':' + key
              obj["_path"] = _path.resolve(basePath, ...target["_name"].split(':'), key)
              obj["_keys"] = []

              // key is a file
              if (_fs.existsSync(obj["_path"]) && _fs.lstatSync(obj["_path"]).isFile())
              {
                checkPerms('get') // check permissions
                return readData(obj["_path"])
              }
              // key is a directory
              else if (_fs.existsSync(obj["_path"]) && _fs.lstatSync(obj["_path"]).isDirectory())
              {
                _fs.readdirSync(obj["_path"], { encoding: 'utf8' }).forEach((key) =>
                {
                  obj["_keys"].push(key)
                })
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
            target._name.split(':').forEach((pathName) =>
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
              delete target[key]
            }
            else if (!key.startsWith('_'))
            {
              writeData(keyPath, value)
              // target[key] = value
            }

          }

        } // END handler.set

    //= END - FN OBJECT TRAPS

    //= START - OBJ INIT

      /*

        OPTIONS:
        args.path = ''// string
        args.name = ''// string
        args.encoding = '' // string
        args.permissions = ''// string
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

              // 🐇 - use custom obj name
              if (args.name)
              {
                if (!_fs.existsSync(_path.resolve(args.path, args.name))) { _fs.mkdirSync(_path.resolve(args.path, args.name)) }
              }

              // 🐇 - use default obj name
              else
              {
                args.name = 'obj-store'
                if (!_fs.existsSync(_path.resolve(args.path, args.name))) { _fs.mkdirSync(_path.resolve(args.path, args.name)) }
              }

              // 🐇 - create obj identifier
              if (!_fs.existsSync(_path.resolve(args.path, args.name, '.obj')))
              {
                _fs.writeFileSync(_path.resolve(args.path, args.name, '.obj'), args.name)
              }

            }
            catch (err) { throw new Error('Failed to create instance at specified path and name! Make sure the path is valid and correct filesystem permissions at specified path and name.') }

            // 🐇 - define relative path
            this["_name"] = args.name

            // 🐇 - define fspath
            this["_path"] = _path.resolve(args.path, args.name)
            basePath = _path.resolve(args.path)

            // 🐇 - define encoding
            this["_encoding"] = args.encoding ? args.encoding : 'utf8'

            // 🐇 - define permissions
            this["_permissions"] = args.permissions ? args.permissions : 'rw'

            // 🐇 - define encryption
            if (typeof(args.encryption) === 'object' && args.encryption.algorithm)
            {
              if (args.encryption.key || args.encryption.keyfile)
              {
                this["_encryption"] = encryptionInit()
              }
              else
              {
                this["_encryption"] = false
              }
            }

            // 🐇 - check instance encryption
            if (this["_encryption"]) // encrypted instance
            {

              // define payload
              let encPayload
              if (encryptionInstance.key) encPayload += encryptionInstance.key
              if (encryptionInstance.keyfile) encPayload += encryptionInstance.keyfile

              // encrypt a non-encrypted instance
              if (!_fs.existsSync(_path.resolve(args.path, args.name, '.secure')))
              {
                _fs.writeFileSync(_path.resolve(args.path, args.name, '.secure'), encryptData(encPayload))
                encPayload = undefined // clear from memory
              }
              // check if provided encryption keys match with the encrypted instance
              else
              {
                try
                {
                  let decPayload = decryptData(_fs.readFileSync(_path.resolve(args.path, args.name, '.secure'), this["_encoding"]))
                  if (encPayload !== decPayload) throw new Error('Encrypted instance key(s) and/or algorithm mismatch!')
                  else decPayload = undefined // clear from memory
                }
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

            this["_keys"] = []
            _fs.readdirSync(_path.resolve(args.path, args.name), { encoding: this["_encoding"] }).forEach((key) =>
            {
              if (!key.startsWith('.')) this["_keys"].push(key)
            })

            // down the rabbit hole we go...
            return true

        } // END init

        // 💊 - take the red pill...
        if (init())
        {
          return new Proxy(this, handler)
        }
        // 💊 - take the blue pill...
        else { throw new Error('Failed to start Obj.js instance! Please check your options.') }

    //= END - OBJ INIT

  }
}

// Follow the _path...
module.exports = Obj
