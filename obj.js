// Obj.js
//
// File-based object datastore system for Node.js.
// Use Javascript objects to set or get data and Javascript functions in the filesystem.
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

    // other variables
    let handler, getData, setData, delData

    // get data from directories using paths, return object
    getData = (parent, child) =>
    { // START getData
      if (typeof(child) !== 'symbol')
      {
      // variables
      let output, files, childDir, childJs, childData, childObj, childId
      childDir = path.resolve(parent.path, child)
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
          if (fs.lstatSync(path.resolve(childDir, file)).isDirectory() && fs.existsSync(path.resolve(childDir, file, '.obj'))) { childObj[file] = getData(childObj, file) }
          // function
          else if (file.endsWith('.js')) { childObj[file.split('.')[0]] = eval(fs.readFileSync(path.resolve(childDir, file)).toString(this.encoding)) }
          // data
          else if (file.endsWith('.dat')) { childObj[file.split('.')[0]] = JSON.parse(fs.readFileSync(path.resolve(childDir, file))) }
        })
        output = new Proxy(childObj, handler)
      }

      // function
      else if (fs.existsSync(childJs)) { output = eval(fs.readFileSync(childJs).toString(this.encoding)) }

      // data
      else if (fs.existsSync(childData)) { output = JSON.parse(fs.readFileSync(childData)) }

      // path
      else if (child === 'path') { output = fs.readFileSync(childId).toString(this.encoding) }

      // return final output
      return output

      }
    } // END getData

    // set data to files and directories using objects, return value that was set
    setData = (parent, child, value) =>
    { // START setData

      // variables
      let output, childDir, childJs, childJsContent, childData, childObj, childId
      childDir = path.resolve(parent.path, child)
      childJs = path.resolve(parent.path, child + '.js')
      childData = path.resolve(parent.path, child + '.dat')
      childId = path.resolve(parent.path, '.obj')

      // BASE VALUE LOGIC // object -> directory
      if (typeof(value) === 'object' && !Array.isArray(value))
      {
        // variables
        childObj = {}
        childObj.path = childDir
        value.path = childObj.path

        // create directory and .obj
        if (!fs.existsSync(childObj.path))
        {
          fs.mkdirSync(childObj.path)
          fs.writeFileSync(path.resolve(childObj.path, '.obj'), childObj.path)
        }
        else if (!fs.existsSync(path.resolve(childObj.path, '.obj')))
        {
          fs.writeFileSync(path.resolve(childObj.path, '.obj'), childObj.path)
        }
        else
        {
          delData(childObj.path)
          fs.mkdirSync(childObj.path)
          fs.writeFileSync(path.resolve(childObj.path, '.obj'), childObj.path)
        }

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
            // set fn as string
            childJsContent = '' + value[valKey]

            // write to fs
            fs.writeFileSync(path.resolve(childObj.path, valKey + '.js'), childJsContent)
            childObj[valKey] = eval(fs.readFileSync(path.resolve(childObj.path, valKey + '.js')).toString(this.encoding))
          }

          // all other data
          else if (typeof(value[valKey]) !== 'undefined' && valKey !== 'path')
          {
            // write to fs
            fs.writeFileSync(path.resolve(childObj.path, valKey + '.dat'), JSON.stringify(value[valKey]))
            childObj[valKey] = JSON.parse(fs.readFileSync(path.resolve(childObj.path, valKey + '.dat')))
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
        value = '' + value
        fs.writeFileSync(childJs, value)
        output = eval(fs.readFileSync(childJs).toString(this.encoding))
      }

      // BASE VALUE LOGIC // all other data
      else if (typeof(value) !== 'undefined')
      {
        // delete conflicting keys
        if (fs.existsSync(childJs)) { fs.unlinkSync(childJs) }
        else if (fs.existsSync(childDir)) { delData(childDir) }

        // write to fs
        fs.writeFileSync(childData, JSON.stringify(value))
        output = JSON.parse(fs.readFileSync(childData))
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

    delData = (arg) =>
    { // START delData

      if (fs.existsSync(arg))
      {
        fs.readdirSync(arg).forEach((file, index) => {
          var curPath = path.resolve(arg, file)
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

    // START proxy handler

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

    // END proxy handler

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
      this.path = path.resolve(this.path, args.name + '.obj')
      if (!fs.existsSync(this.path)) { fs.mkdirSync(this.path) }
    }

    // use default obj name
    else
    {
      this.path = path.resolve(this.path, 'default.obj')
      if (!fs.existsSync(this.path)) { fs.mkdirSync(this.path) }
    }

    // file encoding
    this.encoding = args.encoding ? args.encoding : 'utf8'

    // initialize
    if (!fs.existsSync(this.path, '.obj')) { fs.writeFileSync(path.resolve(this.path, '.obj'), this.path) }
    return new Proxy(this, handler)

  }
}

module.exports = Obj
