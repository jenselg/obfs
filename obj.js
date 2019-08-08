// Obj.js
//
// File-based, object-oriented data store for Node.js
//
// By: Jensel Gatchalian
// Github: https://github.com/jenselg/obj.js
// License: MIT
//

'use strict'

class Obj
{
  constructor (args = {})
  {
    // node libraries
    const os = require('os')
    const fs = require('fs')
    const path = require('path')

    // fn variables
    let handler, getData, setData, writeData, readData, cloneData, delData



    // get data from directories using paths, return object
    getData = (parent, child) =>
    { // START getData
      if (typeof(child) !== 'symbol')
      {

      // variables
      let output, files, childDir, childJs, childData, childObj, childId, childDirId
      childDir = path.resolve(parent.path, child)
      childDirId = path.resolve(parent.path, child, '.obj')
      childJs = path.resolve(parent.path, child + '.js')
      childData = path.resolve(parent.path, child + '.dat')
      childId = path.resolve(parent.path, '.obj')

      // directory
      if (fs.existsSync(childDir))
      {

        childObj = {}
        childObj.path = childDir

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
        output = new Proxy(childObj, handler)
      }

      // function
      else if (fs.existsSync(childJs)) { output = readData(childJs) }

      // data
      else if (fs.existsSync(childData)) { output = readData(childData) }

      // path
      else if (child === 'path') { output = readData(childId) }

      // return final output
      return output

      }
    } // END getData

    // set data to files and directories using objects, return value that was set
    setData = (parent, child, value) =>
    { // START setData

      // variables
      let output, childDir, childJs, childData, childObj, childId
      childDir = path.resolve(parent.path, child)
      childJs = path.resolve(parent.path, child + '.js')
      childData = path.resolve(parent.path, child + '.dat')
      childId = path.resolve(parent.path, '.obj')

      // BASE VALUE LOGIC // object -> directory
      if (typeof(value) === 'object' && !Array.isArray(value))
      {
        // init child object
        childObj = {}

        // create directory and .obj
        if (!fs.existsSync(childDir))
        {
          fs.mkdirSync(childDir)
          fs.writeFileSync(path.resolve(childDir, '.obj'), childDir)
        }
        else if (!fs.existsSync(path.resolve(childDir, '.obj')))
        {
          fs.writeFileSync(path.resolve(childDir, '.obj'), childDir)
        }
        else
        {
          delData(childDir)
          fs.mkdirSync(childDir)
          fs.writeFileSync(path.resolve(childDir, '.obj'), childDir)
        }

        // set path to value and child object
        value = cloneData(value)
        childObj.path = childDir
        value.path = childDir

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
      else if (typeof(value) === 'undefined')
      {
        if (fs.existsSync(childDir)) { delData(childDir), output = undefined }
        else if (fs.existsSync(childJs)) { fs.unlinkSync(childJs), output = undefined }
        else if (fs.existsSync(childData)) { fs.unlinkSync(childData), output = undefined }
      }

      // return final
      return output

    } // END setData

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

    readData = (dataPath) =>
    { // START readData

      // async read - WIP
      if (this.async)
      {
        fs.readFile(dataPath, (err, data) =>
        {
          return data
        })
      }

      // sync read
      else
      {
        if (dataPath.endsWith('.js')) return eval(fs.readFileSync(dataPath, this.encoding))
        else if (dataPath.endsWith('.dat')) return JSON.parse(fs.readFileSync(dataPath, this.encoding))
        else return undefined
      }
    } // END readData

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

    } // end delData



    // handler function object
    handler = {}

    // capture GETs
    handler.get = (target, key) =>
    { // START handler.get
      // NOTES: return the contents of target[key] by reading from folder/files, and if it's a folder return a new proxy
      return getData(target, key)
    } // END handler.get


    // capture SETs
    handler.set = (target, key, value) =>
    { // START handler.set
      // NOTES: value can be obj, fn, or everything else, setData should parse that input, create folders/files, and return the same with value.path set
      // edit 'value' properties here to change the data
      target[key] = setData(target, key, value)
    } // END handler.set



    // use custom path
    if (args.path)
    {
      this.path = path.resolve(args.path)
      if (!fs.existsSync(this.path)) { fs.mkdirSync(this.path) }
    }

    // use home path
    else
    {
      this.path = path.resolve(os.homedir())
    }

    // use custom obj name
    if (args.name)
    {
      this.path = path.resolve(this.path, args.name)
      if (!fs.existsSync(this.path)) { fs.mkdirSync(this.path) }
    }

    // use default obj name
    else
    {
      this.path = path.resolve(this.path, 'data')
      if (!fs.existsSync(this.path)) { fs.mkdirSync(this.path) }
    }

    // file encoding
    this.encoding = args.encoding ? args.encoding : 'utf8'

    // async read/write
    this.async = args.async ? args.async : false

    // initialize
    if (!fs.existsSync(path.resolve(this.path, '.obj')))
    {
      fs.writeFileSync(path.resolve(this.path, '.obj'), this.path)
    }
    return new Proxy(this, handler)

  }
}

module.exports = Obj
