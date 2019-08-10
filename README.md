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

##### Instance options:

    { name: 'obj', path: __dirname } // This creates a folder named 'obj' inside the project folder, containing a .obj file containing the full path

    options.name = 'string'
    - name of the obj instance / folder
    - defaults to 'obj'

    options.path = 'string'
    - base path where to store obj instance / folder
    - defaults to user home directory

    options.encoding = 'string'
    - encoding used for data, see https://github.com/nodejs/node/blob/master/lib/buffer.js
    - defaults to 'utf8'

    options.async = boolean
    - set whether read/write operations are run asynchronously or synchronously
    - defaults to false

    options.permissions = 'string'
    - set read/write permissions for obj instance
    - available permissions: 'r', 'ro', 'w', 'wo', 'rw'
    - read only: 'r' or 'ro'
    - write only: 'w' or 'wo'
    - read and write: 'rw'
    - defaults to 'rw'

##### Set data:

    - All data except for non-array objects and functions, are saved in a file in 'key.dat' format
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

    - synchronously:
    console.log(obj.key)

    - asynchronously:
    obj.key.then((value) => { console.log(value) })

##### Delete / update data:

    - Set the obj.key to undefined, null, or set to other data to delete or replace the data stored in the filesystem

    obj.key = undefined // folders / files deleted from filesystem, and returns undefined
    obj.key = '' // key.data with '' value created and other files / folders with the same key name deleted, returns ''
    ...

### TODO's

    - Add IPFS or libP2P option
    - Add encryption option
    - Add examples
    - Add tests
    - Optimize
    - Refactor

### CREDITS

    By: Jensel Gatchalian
    Github: https://github.com/jenselg/Obj.js
    NPM: https://www.npmjs.com/package/@jenselg/obj.js
    License: MIT
