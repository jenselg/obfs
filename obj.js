// Obj.js
//
// File-based, object-oriented data store for Node.js
//
// Github: https://github.com/jenselg/obj.js
// NPM: https://www.npmjs.com/package/@jenselg/obj.js
//
// Copyright (c) 2019 Jensel Gatchalian <jensel.gatchalian@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//

'use strict'

class Obj
{
  constructor (args = {})
  {

    // LIBRARIES

        const os = require('os')
        const fs = require('fs')
        const path = require('path')

    // VARIABLES

        let getData, setData // FN OBJECT LOGIC
        let readData, writeData, cloneData, delData // FN FS OPS
        let encryptData, decryptData // FN CRYPTO
        let handler = {} // FN OBJECT TRAPS

    // START - FN OBJECT LOGIC

        getData = (parent, child) =>
        { // START getData
          if (typeof(child) !== 'symbol')
          {

          // path property is object notation
          // use args.path as the base path

          // variables
          let output, files, childDir, childJs, childData, childObj, childId, childDirId, objectPath

          childId = path.resolve(args.path, ...parent.path.split('.'), '.obj')
          childDirId = path.resolve(args.path, ...parent.path.split('.'), child, '.obj')

          childDir = path.resolve(args.path, ...parent.path.split('.'), child)
          childJs = path.resolve(args.path, ...parent.path.split('.'), child + '.js')
          childData = path.resolve(args.path, ...parent.path.split('.'), child + '.dat')
          objectPath = parent.path + '.' + child

          // directory
          if (fs.existsSync(childDir))
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

            if (this.async)
            {
              output = new Promise((resolve, reject) =>
              {
                resolve(new Proxy(childObj, handler))
              })
            }
            else
            {
              output = new Proxy(childObj, handler)
            }

          }

          // function
          else if (fs.existsSync(childJs)) { output = readData(childJs) }

          // data
          else if (fs.existsSync(childData)) { output = readData(childData) }

          // path
          else if (child === 'path') { output = readData(childId) }

          // return final output
          // return output
          return output

          }
        } // END getData

        setData = (parent, child, value) =>
        { // START setData

          // variables
          let output, childDir, childJs, childData, childObj, childId, objectPath
          childDir = path.resolve(args.path, ...parent.path.split('.'), child)
          childJs = path.resolve(args.path, ...parent.path.split('.'), child + '.js')
          childData = path.resolve(args.path, ...parent.path.split('.'), child + '.dat')
          childId = path.resolve(args.path, ...parent.path.split('.'), '.obj')
          objectPath = parent.path + '.' + child

          // BASE VALUE LOGIC // object -> directory
          if (typeof(value) === 'object' && !Array.isArray(value))
          {
            // init child object
            childObj = {}

            // set path for value
            value.path = objectPath

            // create directory and .obj
            if (!fs.existsSync(childDir))
            {
              fs.mkdirSync(childDir)
              fs.writeFileSync(path.resolve(childDir, '.obj'), objectPath)
            }
            else if (!fs.existsSync(path.resolve(childDir, '.obj')))
            {
              fs.writeFileSync(path.resolve(childDir, '.obj'), objectPath)
            }
            else
            {
              delData(childDir)
              fs.mkdirSync(childDir)
              fs.writeFileSync(path.resolve(childDir, '.obj'), objectPath)
            }

            // set path to value and child object
            value = cloneData(value)
            childObj.path = objectPath
            value.path = objectPath

            // iterate through object keys
            Object.keys(value).forEach((valKey) =>
            {
              // object - > directory
              if (typeof(value[valKey]) === 'object' && !Array.isArray(value[valKey]))
              {
                // recurse
                setData(value, valKey, value[valKey])
              }

              // js function; () => {}
              else if (typeof(value[valKey]) === 'function')
              {
                // write to fs
                writeData(path.resolve(childDir, valKey + '.js'), '' + value[valKey])
                // set to value
                childObj[valKey] = value[valKey]
              }

              // all other data
              else if (typeof(value[valKey]) !== 'undefined' && valKey !== 'path')
              {
                // write to fs
                writeData(path.resolve(childDir, valKey + '.dat'), JSON.stringify(value[valKey]))
                // set to value
                childObj[valKey] = value[valKey]
              }

            })

            output = new Proxy(childObj, handler)
          }

          // BASE VALUE LOGIC // js function; () => {}
          else if (typeof(value) === 'function')
          {

            // delete conflicting keys
            if (fs.existsSync(childData)) { fs.unlinkSync(childData) }
            else if (fs.existsSync(childDir)) { delData(childDir) }
            // write to fs
            writeData(childJs, '' + value)
            output = value

          }

          // BASE VALUE LOGIC // all other data
          else if (typeof(value) !== 'undefined' && value !== 'path')
          {

            // delete conflicting keys
            if (fs.existsSync(childJs)) { fs.unlinkSync(childJs) }
            else if (fs.existsSync(childDir)) { delData(childDir) }
            // write to fs
            writeData(childData, JSON.stringify(value))
            output = value

          }

          // BASE VALUE LOGIC // undefined; erase data
          else if (typeof(value) === 'undefined' || value === null)
          {
            if (fs.existsSync(childDir)) { delData(childDir), output = undefined }
            else if (fs.existsSync(childJs)) { fs.unlinkSync(childJs), output = undefined }
            else if (fs.existsSync(childData)) { fs.unlinkSync(childData), output = undefined }
          }

          // return final
          return output

        } // END setData

    // END - FN OBJECT LOGIC

    // START - FN FS OPS

        readData = (dataPath) =>
        { // START readData
          let output
          if (this.async)
          {
            try
            {
              if (dataPath.endsWith('.js'))
              {
                output = new Promise((resolve, reject) =>
                {
                  fs.readFile(dataPath, this.encoding, (err, data) =>
                  {
                    if (err) reject (err)
                    resolve(new Function('"use strict"; return ' + data)())
                  })
                })
              }
              else if (dataPath.endsWith('.dat'))
              {
                output = new Promise((resolve, reject) =>
                {
                  fs.readFile(dataPath, this.encoding, (err, data) =>
                  {
                    if (err) reject (err)
                    resolve(JSON.parse(data))
                  })
                })
              }
              else
              {
                output = new Promise((resolve, reject) =>
                {
                  fs.readFile(dataPath, this.encoding, (err, data) =>
                  {
                    if (err) reject (err)
                    resolve(data)
                  })
                })
              }
            } catch (err) { output = undefined }
          }
          else
          {
            if (dataPath.endsWith('.js')) output = new Function('"use strict"; return ' + fs.readFileSync(dataPath, this.encoding))()
            else if (dataPath.endsWith('.dat')) output = JSON.parse(fs.readFileSync(dataPath, this.encoding))
            else output = fs.readFileSync(dataPath, this.encoding)
          }
          return output
        } // END readData

        writeData = (dataPath, dataContent) =>
        { // START writeData

          if (this.async)
          {
            fs.writeFile(dataPath, dataContent, (err) => { if (err) throw err })
          }

          else
          {
            fs.writeFileSync(dataPath, dataContent)
          }

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

    // END - FN FS OPS

    // START - FN CRYPTO

        encryptData = (type, key, data) => {}
        decryptData = (type, key, data) => {}

    // END - FN CRYPTO

    // START - FN OBJECT TRAPS

        handler.get = (target, key) =>
        { // START handler.get
          // NOTES: return the contents of target[key] by reading from folder/files, and if it's a folder return a new proxy
          switch (this.permissions)
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
          // NOTES: value can be obj, fn, or everything else, setData should parse that input, create folders/files, and return the same with value.path set
          // edit 'value' properties here to change the data
          switch (this.permissions)
          {
            case 'r':
            case 'ro':
              break
            case 'w':
            case 'wo':
              target[key] = setData(target, key, value)
              break
            case 'rw':
              target[key] = setData(target, key, value)
              break
            default:
              throw new Error('Invalid permission set for Obj.js instance. Valid permissions: r, ro, w, wo, rw')
          }

          return true

        } // END handler.set

    // END - FN OBJECT TRAPS

    // START - OBJ INIT

        // use custom path
        if (args.path)
        {
          args.path = path.resolve(args.path)
          if (!fs.existsSync(args.path)) { fs.mkdirSync(args.path) }
        }

        // use home path
        else
        {
          args.path = os.homedir()
        }

        // use custom obj name
        if (args.name)
        {
          if (!fs.existsSync(path.resolve(args.path, args.name))) { fs.mkdirSync(path.resolve(args.path, args.name)) }
        }

        // use default obj name
        else
        {
          args.name = 'obj'
          if (!fs.existsSync(path.resolve(args.path, args.name))) { fs.mkdirSync(path.resolve(args.path, args.name)) }
        }

        // define path
        this.path = args.name

        // define encoding
        this.encoding = args.encoding ? args.encoding : 'utf8'

        // define async
        this.async = args.async ? args.async : false

        // define permissions
        this.permissions = args.permissions ? args.permissions : 'rw'

        // obj instance initialize
        if (!fs.existsSync(path.resolve(args.path, '.obj')))
        {
          fs.writeFileSync(path.resolve(args.path, '.obj'), this.path)
        }

        // define instance
        this.instance = path.resolve(args.path, this.path)

        // divide by zero
        return new Proxy(this, handler)

    // END - OBJ INIT

  }
}

module.exports = Obj
