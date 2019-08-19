<p align="center">
  <img src="https://github.com/jenselg/Obj.js/raw/master/misc/obj.js-logo.png" alt="Obj.js-logo" width="300" />
</p>

<h2 align="center">File-based, object-oriented data store for Node.js</h2>

### INSTALLATION

    In your project directory:

    npm install --save @jenselg/obj.js

### HOW TO USE

##### Create new instance:

    const Obj = require('@jenselg/obj.js')
    let obj = new Obj(options)

    - options argument is optional - see below

##### Instance options:

    - instance options should be an object

      { name: 'obj', path: __dirname }

    options.name = 'string'
    - name of the obj instance / folder
    - defaults to 'obj'

    options.path = 'string'
    - base path where to store obj instance / folder
    - defaults to user home directory

    options.encoding = 'string'
    - encoding used for data, see https://github.com/nodejs/node/blob/master/lib/buffer.js
    - defaults to 'utf8'

    options.permissions = 'string'
    - set read/write permissions for obj instance
    - available permissions: 'r', 'ro', 'w', 'wo', 'rw'
    - read only: 'r' or 'ro'
    - write only: 'w' or 'wo'
    - read and write: 'rw'
    - defaults to 'rw'

##### Instance notes:

    - path of the instance in the filesystem is accessed via the filesystem property of the instance

      const Obj = require('@jenselg/obj.js')
      let obj = new Obj()
      console.log(obj.filesystem) // /Users/yourname/obj

    - nested object paths are strings in dot notation

      const Obj = require('@jenselg/obj.js')
      let obj = new Obj()
      obj.one = {}
      obj.one.two = {}
      obj.one.two.three = {}
      console.log(obj.one.two.three.path) // 'obj.one.two.three'

##### Planned instance options:

    options.encryption = { type = '', key }
    - encrypt/decrypt data using the selected symmetric encryption type

    options.remote = { address = '', credentials: { password: '', passphrase: '', key: '' }, path = '' }
    - connect to a server via SSH to use Obj.js remotely

    options.ipfs = { options: { persist: boolean, pubsub: boolean }, addresses: [''] }
    - get data from IPNS addresses and map contents to Obj.js instance
    - generate a local IPNS address for the Obj.js instance
    - synchronize data between remote and local

##### Set data:

    - all data except for associative arrays and functions, are saved in a file in 'key.dat' format
    - functions are saved in a file in 'key.js' format
    - associative arrays are treated and created as folders, and identified with a .obj file containing the relative path in dot notation
    - objects inside arrays are treated as-is and not as folders

    - string:

      obj.key = 'string'

    - integer:

      obj.key = 12345

    - float:

      obj.key = 1.2345

    - array:

      obj.key = [1,2,3,4,5]

    - boolean:

      obj.key = true

    - functions:

      obj.key = (data) => { return data }
      obj.key()

    - objects:

      obj.key = {}
      obj.key.nested = 'nested'

##### Get data:

    - just like a regular object

      console.log(obj.key)

##### Delete / update data:

    - set the obj.key to undefined, null, or set to other data to delete or replace the data stored in the filesystem

      obj.key = undefined // folders / files deleted from filesystem, and returns undefined
      obj.key = '' // key.data with '' value created and other files / folders with the same key name deleted, returns ''

### CREDITS

    By: Jensel Gatchalian
    Github: https://github.com/jenselg/Obj.js
    NPM: https://www.npmjs.com/package/@jenselg/obj.js

### LICENSE

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
