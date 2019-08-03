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
    let obj = new Obj(options) // options argument is optional - see below

    Options:

    { name: 'data', path: __dirname } // This creates a data.obj folder inside the project folder

    options.name = 'string'
    - name of the obj instance / folder, folder names end in .obj automatically
    - defaults to 'default'

    options.path = 'string'
    - base path where to store obj instance / folder
    - defaults to the user home directory

    options.encoding = 'string'
    - encoding used for data, see https://github.com/nodejs/node/blob/master/lib/buffer.js
    - defaults to 'utf8'

##### Set data:

    - All data except for non-array objects and functions, are saved in a file in 'key.data' format
    - Functions are saved in a file in 'key.js' format
    - Non-array objects are treated and created as folders, and identified with a .obj file containing the full path
    - Objects inside arrays are treated as-is and not as folders

    String:
    obj.key = 'string'

    Integer:
    obj.key = 12345

    Float:
    obj.key = 1.2345

    Array:
    obj.key = [1,2,3,4,5]

    Boolean:
    obj.key = true

    Functions:
    obj.key = (data) => { return data }
    obj.key()

    Objects:
    obj.key = {}
    obj.key.nested = 'nested'

##### Get data:

    - Same as a regular Javascript variable / object

    obj.key = 'data'
    obj.key // returns 'data'

##### Delete / Update data:

    - Set the obj.key to undefined or other data to delete or replace the data stored in the filesystem

    obj.key = undefined // folders / files deleted from filesystem, and returns undefined
    obj.key = '' // key.data with '' value created and other files / folders with the same key name deleted, returns ''
    ...

### TODO's

    - Add IPFS or libP2P option
    - Add encryption option
    - Add access privileges option
    - Add examples
    - Add tests
    - Optimize
    - Refactor

### CREDITS

    By: Jensel Gatchalian
    Github: https://github.com/jenselg/Obj.js
    License: MIT
