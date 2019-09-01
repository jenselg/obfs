/*

  OBFS

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

const os = require('os')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

class OBFS
{
  constructor (args = {})
  {

    //= VARIABLES

        let getData, setData // FN OBJECT LOGIC
        let readData, writeData, cloneData, delData // FN FS OPS
        let encryptData, decryptData, encryptKey, decryptKey, encryptionInit, encryptionInstance // FN CRYPTO
        let handler = {} // FN OBJECT TRAPS
        let init // FN INIT

    //= START - FN OBJECT LOGIC

        getData = (parent, child) =>
        { // START getData
          if (typeof(child) !== 'symbol' && child !== 'inspect')
          {

          // path property is object notation
          // use args.path as the base path

          // variables
          let output, files,
          childDir, childJs, childData,
          childObj, childId, childDirId,
          objectPath, currDir

          // default output
          output = undefined

          // set paths
          childId = path.resolve(args.path, ...parent["obfs_name"].split('.'), '.obfs')
          childDirId = path.resolve(args.path, ...parent["obfs_name"].split('.'), child, '.obfs')
          childDir = path.resolve(args.path, ...parent["obfs_name"].split('.'), child)
          childJs = path.resolve(args.path, ...parent["obfs_name"].split('.'), child + '.js')
          childData = path.resolve(args.path, ...parent["obfs_name"].split('.'), child + '.dat')
          objectPath = parent["obfs_name"] + '.' + child
          currDir = path.resolve(args.path, ...parent["obfs_name"].split('.'))

          // filesystem path
          if (child === 'obfs_path')
          { if (fs.existsSync(currDir)) { output = currDir } }

          // directory
          else if (fs.existsSync(childDir))
          {

            childObj = {}
            childObj['obfs_path'] = childDir
            childObj['obfs_name'] = objectPath

            files = fs.readdirSync(childDir, { encoding: this.options["obfs_encoding"] })
            files.forEach((file) =>
            {
              // directory
              if (fs.lstatSync(path.resolve(childDir, file)).isDirectory() && fs.existsSync(path.resolve(childDir, file, '.obfs')))
              { childObj[file] = getData(childObj, file) }

              // function
              else if (file.endsWith('.js'))
              { childObj[file.split('.')[0]] = readData(path.resolve(childDir, file)) }

              // data
              else if (file.endsWith('.dat'))
              { childObj[file.split('.')[0]] = readData(path.resolve(childDir, file)) }

            })

            // return output
            output = new Proxy(childObj, handler)

          }

          // function
          else if (fs.existsSync(childJs))
          { output = readData(childJs) }

          // data
          else if (fs.existsSync(childData))
          { output = readData(childData) }

          // path
          else if (child === 'obfs_name')
          { output = readData(childId) }

          // return output
          return output

          }
        } // END getData

        setData = (parent, child, value) =>
        { // START setData

          // variables
          let output,
          childDir, childJs, childData,
          childObj, childId, objectPath

          // set paths
          childDir = path.resolve(args.path, ...parent["obfs_name"].split('.'), child)
          childJs = path.resolve(args.path, ...parent["obfs_name"].split('.'), child + '.js')
          childData = path.resolve(args.path, ...parent["obfs_name"].split('.'), child + '.dat')
          childId = path.resolve(args.path, ...parent["obfs_name"].split('.'), '.obfs')
          objectPath = parent["obfs_name"] + '.' + child

          // BASE VALUE LOGIC // object -> directory
          if (typeof(value) === 'object' && !Array.isArray(value))
          {

            // delete existing js file
            if (fs.existsSync(childJs))
            { fs.unlinkSync(childJs) }

            // delete existing data file
            if (fs.existsSync(childData))
            { fs.unlinkSync(childData) }

            // create directory and .obfs
            if (!fs.existsSync(childDir))
            {
              fs.mkdirSync(childDir)
              fs.writeFileSync(path.resolve(childDir, '.obfs'), objectPath)
            }

            // remove current directory and recreate along with .obfs
            else
            {
              delData(childDir)
              fs.mkdirSync(childDir)
              fs.writeFileSync(path.resolve(childDir, '.obfs'), objectPath)
            }

            // iteration vars
            childObj = {}
            value["obfs_name"] = objectPath
            value = cloneData(value)
            childObj["obfs_name"] = objectPath
            value["obfs_name"] = objectPath

            // iterate through object keys
            Object.keys(value).forEach((valKey) =>
            {

              // object - > directory
              if (typeof(value[valKey]) === 'object' && !Array.isArray(value[valKey]))
              {
                // set to value
                childObj[valKey] = value[valKey]
                // recurse
                setData(value, valKey, value[valKey])
              }

              // js function; () => {}
              else if (typeof(value[valKey]) === 'function')
              {
                // set to value
                childObj[valKey] = value[valKey]
                // write to fs
                writeData(path.resolve(args.path, ...value["obfs_name"].split('.'), valKey + '.js'), '' + value[valKey])
              }

              // all other data
              else if (typeof(value[valKey]) !== 'undefined' && typeof(value[valKey]) !== 'symbol' && !valKey.startsWith('obfs'))
              {
                // set to value
                childObj[valKey] = value[valKey]
                // write to fs
                writeData(path.resolve(args.path, ...value["obfs_name"].split('.'), valKey + '.dat'), JSON.stringify(value[valKey]))
              }

            })

            output = new Proxy(childObj, handler)

          }

          // BASE VALUE LOGIC // js function; () => {}
          else if (typeof(value) === 'function')
          {

            // set output
            output = value
            // delete conflicting keys
            if (fs.existsSync(childData)) { fs.unlinkSync(childData) }
            else if (fs.existsSync(childDir)) { delData(childDir) }
            // write to fs
            writeData(childJs, '' + value)

          }

          // BASE VALUE LOGIC // all other data
          else if (typeof(value) !== 'undefined' && typeof(value) !== 'symbol' && !child.startsWith('obfs'))
          {

            // set output
            output = value
            // delete conflicting keys
            if (fs.existsSync(childJs)) { fs.unlinkSync(childJs) }
            else if (fs.existsSync(childDir)) { delData(childDir) }
            // write to fs
            writeData(childData, JSON.stringify(value))

          }

          // BASE VALUE LOGIC // undefined; erase data
          else if (typeof(value) === 'undefined' || value === null)
          {
            if (fs.existsSync(childDir)) { delData(childDir), output = undefined }
            else if (fs.existsSync(childJs)) { fs.unlinkSync(childJs), output = undefined }
            else if (fs.existsSync(childData)) { fs.unlinkSync(childData), output = undefined }
          }

          // return final
          // return output
          return output

        } // END setData

    //= END - FN OBJECT LOGIC

    //= START - FN FS OPS

        readData = (dataPath) =>
        { // START readData

          if (this.options["obfs_encryption"])
          {
            try
            {
              if (dataPath.endsWith('.js')) return new Function('"use strict"; return ' + decryptData(fs.readFileSync(dataPath, this.options["obfs_encoding"])))()
              else if (dataPath.endsWith('.dat')) return JSON.parse(decryptData(fs.readFileSync(dataPath, this.options["obfs_encoding"])))
              else return decryptData(fs.readFileSync(dataPath, this.options["obfs_encoding"]))
            } catch (err) { return undefined }
          }
          else
          {
            try
            {
              if (dataPath.endsWith('.js')) return new Function('"use strict"; return ' + fs.readFileSync(dataPath, this.options["obfs_encoding"]))()
              else if (dataPath.endsWith('.dat')) return JSON.parse(fs.readFileSync(dataPath, this.options["obfs_encoding"]))
              else return fs.readFileSync(dataPath, this.options["obfs_encoding"])
            } catch (err) { return undefined }
          }

        } // END readData

        writeData = (dataPath, dataContent) =>
        { // START writeData

          if (this.options["obfs_encryption"]) dataContent = encryptData(dataContent)
          fs.writeFileSync(dataPath, dataContent)

        } // END writeData

        cloneData = (object) =>
        { // START cloneData

          let keys = Object.keys(object)
          let newObject = {}
          keys.forEach((key) =>
          {
            newObject[key] = object[key]
          })
          return newObject

        } // END cloneData

        delData = (arg) =>
        { // START delData

          if (fs.existsSync(arg))
          {

            fs.readdirSync(arg).forEach((file, index) => {
              let curPath = path.resolve(arg, file)
              if (fs.lstatSync(curPath).isDirectory())
              { // recurse
                delData(curPath)
              }
              else
              { // delete file
                fs.unlinkSync(curPath)
              }
            })
            fs.rmdirSync(arg)
          }

        } // END delData

    //= END - FN FS OPS

    //= START - FN CRYPTO

        encryptData = (data) =>
        { // START encryptData

          encryptKey(encryptionInstance.key, encryptionInstance.keyfile, encryptionInstance.keyLength).forEach((key) =>
          {
            let iv = crypto.randomBytes(16)
            let cipher = crypto.createCipheriv(encryptionInstance.algorithm, new Buffer.from(key), iv)
            let encStr = Buffer.concat([cipher.update(data), cipher.final()]).toString('hex')
            data = iv.toString('hex').substring(0, 16) + encStr + iv.toString('hex').substring(16, 32)
          })
          return data

        } // END encryptData

        decryptData = (data) =>
        { // START decryptData

          decryptKey(encryptionInstance.key, encryptionInstance.keyfile, encryptionInstance.keyLength).forEach((key) =>
          {
            let iv = new Buffer.from(data.slice(0, 16) + data.slice(-16, data.length), 'hex')
            let decipher = crypto.createDecipheriv(encryptionInstance.algorithm, new Buffer.from(key), iv)
            let encBuffer = new Buffer.from(data.slice(0, -16).substr(16), 'hex')
            data = Buffer.concat([decipher.update(encBuffer), decipher.final()]).toString()
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
                  return crypto.createHash('sha256').update(val + keyfile + val).digest()
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
                  return crypto.createHash('sha256').update(val).digest()
                  break

                default:
                  // return nothing
              }
            })
          }
          else if (!key && keyfile)
          {
            keyArr = [crypto.createHash('sha256').update(keyfile).digest()]
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
                  return crypto.createHash('sha256').update(val + keyfile + val).digest()
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
                  return crypto.createHash('sha256').update(val).digest()
                  break

                default:
                  // return nothing
              }
            })
          }
          else if (!key && keyfile)
          {
            keyArr = [crypto.createHash('sha256').update(keyfile).digest()]
          }

          return keyArr.reverse()

        } // END decryptKey

        encryptionInit = () =>
        { // START encryptionInit

          encryptionInstance = {}
          encryptionInstance.algorithm = args.encryption.algorithm
          encryptionInstance.key = args.encryption.key ? args.encryption.key : undefined
          encryptionInstance.keyfile = args.encryption.keyfile ? fs.readFileSync(path.resolve(args.encryption.keyfile), this.options["obfs_encoding"]).split('\n').filter(Boolean).join('') : undefined
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

          // NOTES: return the contents of target[key] by reading from folder/files, and if it's a folder return a new proxy
          switch (this.options["obfs_permissions"])
          {
            case 'r':
            case 'ro':
              return getData(target, key)
              break
            case 'w':
            case 'wo':
              break
            case 'rw':
              return getData(target, key)
              break
            default:
              throw new Error('Invalid permission set for Obj.js instance. Valid permissions: r, ro, w, wo, rw')
          }

        } // END handler.get

        handler.set = (target, key, value) =>
        { // START handler.set

          // NOTES: value can be obj, fn, or everything else, setData should parse that input, create folders/files, and return the same with value["obfs_name"] set
          // edit 'value' properties here to change the data

          switch (this.options["obfs_permissions"])
          {
            case 'r':
            case 'ro':
              return false
              break
            case 'w':
            case 'wo':
              target[key] = setData(target, key, value)
              return true
              break
            case 'rw':
              target[key] = setData(target, key, value)
              return true
              break
            default:
              throw new Error('Invalid permission set for Obj.js instance. Valid permissions: r, ro, w, wo, rw')
              return false
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

            this.options = {}

            try { // catch errors for instance creation at specified path and name

              // 🐇 - use custom path
              if (args.path)
              {
                args.path = path.resolve(args.path)
                if (!fs.existsSync(args.path)) { fs.mkdirSync(args.path) }
              }

              // 🐇 - use home path
              else
              {
                args.path = os.homedir()
              }

              // 🐇 - use custom obj name
              if (args.name)
              {
                if (!fs.existsSync(path.resolve(args.path, args.name))) { fs.mkdirSync(path.resolve(args.path, args.name)) }
              }

              // 🐇 - use default obj name
              else
              {
                args.name = 'obfs'
                if (!fs.existsSync(path.resolve(args.path, args.name))) { fs.mkdirSync(path.resolve(args.path, args.name)) }
              }

              // 🐇 - create obj identifier
              if (!fs.existsSync(path.resolve(args.path, args.name, '.obfs')))
              {
                fs.writeFileSync(path.resolve(args.path, args.name, '.obfs'), args.name)
              }

            }
            catch (err) { throw new Error('Failed to create instance at specified path and name! Make sure the path is valid and correct filesystem permissions at specified path and name.') }

            // 🐇 - define relative path
            this.options["obfs_name"] = args.name

            // 🐇 - define fspath
            this.options["obfs_path"] = path.resolve(args.path, args.name)

            // 🐇 - define encoding
            this.options["obfs_encoding"] = args.encoding ? args.encoding : 'utf8'

            // 🐇 - define permissions
            this.options["obfs_permissions"] = args.permissions ? args.permissions : 'rw'

            // 🐇 - define encryption
            if (typeof(args.encryption) === 'object' && args.encryption.algorithm)
            {
              if (args.encryption.key || args.encryption.keyfile)
              {
                this.options["obfs_encryption"] = encryptionInit()
              }
              else
              {
                this.options["obfs_encryption"] = false
              }
            }

            // 🐇 - check instance encryption
            if (this.options["obfs_encryption"]) // encrypted instance
            {

              // define payload
              let encPayload
              if (encryptionInstance.key) encPayload += encryptionInstance.key
              if (encryptionInstance.keyfile) encPayload += encryptionInstance.keyfile

              // encrypt a non-encrypted instance
              if (!fs.existsSync(path.resolve(args.path, args.name, '.secure')))
              {
                fs.writeFileSync(path.resolve(args.path, args.name, '.secure'), encryptData(encPayload))
              }
              // check if provided encryption keys match with the encrypted instance
              else
              {
                try
                {
                  let decPayload = decryptData(fs.readFileSync(path.resolve(args.path, args.name, '.secure'), this.options["obfs_encoding"]))
                  if (encPayload !== decPayload) throw new Error('Encrypted instance key(s) and/or algorithm mismatch!')
                }
                catch (err) { throw new Error('Encrypted instance key(s) and/or algorithm mismatch!') }
              }

            }
            else // unencrypted instance
            {
              // data store is encrypted
              if (fs.existsSync(path.resolve(args.path, args.name, '.secure')))
              {
                throw new Error('Cannot start unencrypted instance on an encrypted data store!')
              }
            }

            // down the rabbit hole we go...
            return true

        } // END init

        // 💊 - take the red pill...
        if (init())
        {
          let object = {}
          object['obfs_name'] = this.options['obfs_name']
          object['obfs_path'] = this.options['obfs_path']
          let proxy = new Proxy(object, handler)
          if (!proxy.data) proxy.data = {}
          this.data = proxy.data
        }
        // 💊 - take the blue pill...
        else { throw new Error('Failed to start Obj.js instance! Please check your options.') }

    //= END - OBJ INIT

  }
}

// follow the path...
module.exports = OBFS
