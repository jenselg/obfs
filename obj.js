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

class Obj
{
  constructor (args = {})
  {

    //= LIBRARIES

        const os = require('os')
        const fs = require('fs')
        const path = require('path')
        const crypto = require('crypto')

    //= VARIABLES

        let getData, setData // FN OBJECT LOGIC
        let readData, writeData, cloneData, delData // FN FS OPS
        let encryptData, decryptData, encryptKey, decryptKey, encryptionInit, encryptionInstance // FN CRYPTO
        let handler = {} // FN OBJECT TRAPS
        let init // FN INIT

    //= SPECIAL INSTANCE PROPERTIES

        let specials =
        [
          'path', 'fspath', 'name', 'encoding', 'permissions', 'encryption'
        ]

    //= START - FN OBJECT LOGIC

        getData = (parent, child) =>
        { // START getData
          if (typeof(child) !== 'symbol')
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
          childId = path.resolve(args.path, ...parent.path.split('.'), '.obj')
          childDirId = path.resolve(args.path, ...parent.path.split('.'), child, '.obj')
          childDir = path.resolve(args.path, ...parent.path.split('.'), child)
          childJs = path.resolve(args.path, ...parent.path.split('.'), child + '.js')
          childData = path.resolve(args.path, ...parent.path.split('.'), child + '.dat')
          objectPath = parent.path + '.' + child
          currDir = path.resolve(args.path, ...parent.path.split('.'))

          // filesystem path
          if (child === 'fspath')
          { if (fs.existsSync(currDir)) { output = currDir } }

          // directory
          else if (fs.existsSync(childDir))
          {

            childObj = {}
            childObj.path = objectPath

            files = fs.readdirSync(childDir, { encoding: this.encoding })
            files.forEach((file) =>
            {
              // directory
              if (fs.lstatSync(path.resolve(childDir, file)).isDirectory() && fs.existsSync(path.resolve(childDir, file, '.obj')))
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
          else if (child === 'path')
          { output = readData(childId) }

          // return output
          return parent[child] || output

          }
        } // END getData

        setData = (parent, child, value) =>
        { // START setData

          // variables
          let output,
          childDir, childJs, childData,
          childObj, childId, objectPath

          // set paths
          childDir = path.resolve(args.path, ...parent.path.split('.'), child)
          childJs = path.resolve(args.path, ...parent.path.split('.'), child + '.js')
          childData = path.resolve(args.path, ...parent.path.split('.'), child + '.dat')
          childId = path.resolve(args.path, ...parent.path.split('.'), '.obj')
          objectPath = parent.path + '.' + child

          // BASE VALUE LOGIC // object -> directory
          if (typeof(value) === 'object' && !Array.isArray(value))
          {

            // delete existing js file
            if (fs.existsSync(childJs))
            { fs.unlinkSync(childJs) }

            // delete existing data file
            if (fs.existsSync(childData))
            { fs.unlinkSync(childData) }

            // create directory and .obj
            if (!fs.existsSync(childDir))
            {
              fs.mkdirSync(childDir)
              fs.writeFileSync(path.resolve(childDir, '.obj'), objectPath)
            }

            // remove current directory and recreate along with .obj
            else
            {
              delData(childDir)
              fs.mkdirSync(childDir)
              fs.writeFileSync(path.resolve(childDir, '.obj'), objectPath)
            }

            // iteration vars
            childObj = {}
            value.path = objectPath
            value = cloneData(value)
            childObj.path = objectPath
            value.path = objectPath

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
                writeData(path.resolve(args.path, ...value.path.split('.'), valKey + '.js'), '' + value[valKey])
              }

              // all other data
              else if (typeof(value[valKey]) !== 'undefined' && typeof(value[valKey]) !== 'symbol' && valKey !== 'path' && valKey !== 'fspath')
              {
                // set to value
                childObj[valKey] = value[valKey]
                // write to fs
                writeData(path.resolve(args.path, ...value.path.split('.'), valKey + '.dat'), JSON.stringify(value[valKey]))
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
          else if (typeof(value) !== 'undefined' && typeof(value) !== 'symbol' && child !== 'path' && child !== 'fspath')
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

          if (this.encryption)
          {
            try
            {
              if (dataPath.endsWith('.js')) return new Function('"use strict"; return ' + decryptData(fs.readFileSync(dataPath, this.encoding)))()
              else if (dataPath.endsWith('.dat')) return JSON.parse(decryptData(fs.readFileSync(dataPath, this.encoding)))
              else return decryptData(fs.readFileSync(dataPath, this.encoding))
            } catch (err) { return undefined }
          }
          else
          {
            try
            {
              if (dataPath.endsWith('.js')) return new Function('"use strict"; return ' + fs.readFileSync(dataPath, this.encoding))()
              else if (dataPath.endsWith('.dat')) return JSON.parse(fs.readFileSync(dataPath, this.encoding))
              else return fs.readFileSync(dataPath, this.encoding)
            } catch (err) { return undefined }
          }

        } // END readData

        writeData = (dataPath, dataContent) =>
        { // START writeData

          if (this.encryption) dataContent = encryptData(dataContent)
          fs.writeFile(dataPath, dataContent, (err) => { if (err) throw err })

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
          if (fs.existsSync(path.resolve(args.encryption.keyfile)))
          { encryptionInstance.keyfile = fs.readFileSync(path.resolve(args.encryption.keyfile), this.encoding).split('\n').filter(Boolean).join('') }
          else
          { encryptionInstance.keyfile = undefined }
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
          switch (this.permissions)
          {
            case 'r':
            case 'ro':
              if (target.path === this.path && specials.indexOf(key) >= 0) return this[key]
              else return getData(target, key)
              break
            case 'w':
            case 'wo':
              break
            case 'rw':
              if (target.path === this.path && specials.indexOf(key) >= 0) return this[key]
              else return getData(target, key)
              break
            default:
              throw new Error('Invalid permission set for Obj.js instance. Valid permissions: r, ro, w, wo, rw')
          }

        } // END handler.get

        handler.set = (target, key, value) =>
        { // START handler.set

          // NOTES: value can be obj, fn, or everything else, setData should parse that input, create folders/files, and return the same with value.path set
          // edit 'value' properties here to change the data

          switch (this.permissions)
          {
            case 'r':
            case 'ro':
              break
            case 'w':
            case 'wo':
              if (target.path === this.path && specials.indexOf(key) >= 0) throw new Error('Cannot set special properties!')
              else target[key] = setData(target, key, value)
              break
            case 'rw':
              if (target.path === this.path && specials.indexOf(key) >= 0) throw new Error('Cannot set special properties!')
              else target[key] = setData(target, key, value)
              break
            default:
              throw new Error('Invalid permission set for Obj.js instance. Valid permissions: r, ro, w, wo, rw')
          }

          return true

        } // END handler.set

    //= END - FN OBJECT TRAPS

    //= START - OBJ INIT

      /*

        OPTIONS:
        args.path = ''// string
        args.name = ''// string
        args.encoding = '' // string
        args.permissions = ''// string
        args.encryption = { algorithm: '', keys: ':::...' } // object

      */

        init = () =>
        { // START init

          // follow the white rabbit...
          try
          {
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
              args.name = 'obj-store'
              if (!fs.existsSync(path.resolve(args.path, args.name))) { fs.mkdirSync(path.resolve(args.path, args.name)) }
            }

            // 🐇 - define path
            this.path = args.name

            // 🐇 - define fspath
            this.fspath = path.resolve(args.path, args.name)

            // 🐇 - define encoding
            this.encoding = args.encoding ? args.encoding : 'utf8'

            // 🐇 - define permissions
            this.permissions = args.permissions ? args.permissions : 'rw'

            // 🐇 - define encryption
            if (typeof(args.encryption) === 'object' && args.encryption.algorithm)
            {
              if (args.encryption.key || args.encryption.keyfile)
              {
                this.encryption = encryptionInit()
              }
              else
              {
                this.encryption = false
              }
            }

            // 🐇 - check instance encryption
            if (this.encryption)
            {
              if (!fs.existsSync(path.resolve(args.path, args.name, '.secure')))
              {
                fs.writeFileSync(path.resolve(args.path, args.name, '.secure'), this.path)
              }
            }
            else
            {
              if (fs.existsSync(path.resolve(args.path, args.name, '.secure')))
              {
                throw new Error('Cannot start unencrypted instance on an encrypted data store!')
              }
            }

            // 🐇 - create obj identifier
            if (!fs.existsSync(path.resolve(args.path, args.name, '.obj')))
            {
              fs.writeFileSync(path.resolve(args.path, args.name, '.obj'), this.path)
            }

            // down the rabbit hole we go...
            return true

          }

          // you lost your way...
          catch (err)
          { return false }

        } // END init

        // 💊 - take the red pill...
        if (init()) return new Proxy(this, handler)
        // 💊 - take the blue pill...
        else { throw new Error('Failed to start Obj.js instance. Please check your options.') }

    //= END - OBJ INIT

  }
}

// follow the path...
module.exports = Obj
