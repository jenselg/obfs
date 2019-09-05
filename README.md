<p align="center">
  <img src="https://github.com/jenselg/Obj.js/raw/master/misc/obj.js-logo.png" alt="Obj.js-logo" width="300" />
</p>

<h2 align="center">File-based, object-oriented data store for Node.js</h2>

### FEATURES

- use Javascript objects and object notation to read / write from the filesystem / datastore
- symmetric encryption of data using multiple keys
- read / write permissions for instances


### INSTALLATION

##### In your project directory:

    npm install --save @jenselg/obj.js


### HOW TO USE

##### Create new instance:

    const Obj = require('@jenselg/obj.js')
    let obj = new Obj(options)


##### Instance options:

- optional
- options should be an object

      { name: 'obj-store', path: '/some/path' }

- name of the obj instance / folder, defaults to 'obj-store'

      options.name = 'string'

- base path where to store obj instance / folder, defaults to user home directory

      options.path = 'string'

- encoding used for data, defaults to 'utf8'

      options.encoding = 'string'

- set read/write permissions for obj instance

      options.permissions = 'string'

 - read only: 'r'
 - write only: 'w'
 - read and write: 'rw'
 - defaults to 'rw'


- set encryption for obj instance

      options.encryption = {}
      options.encryption.algorithm = 'string'
      options.encryption.key = 'string'
      options.encryption.keyfile = '/path/to/keyfile'

 - available algorithms: 'aes256', 'aria256', 'camellia256'
 - key(s) formats:
   - 'key'
     - string
     -single-level encryption
   - 'a:sequence:of:different:keys'
     - string
     - multi-level encryption
     - recursive
     - colon-separated values
   - keyfile
     - optional
     - if provided, key property is optional
 - if both key and keyfile are present, both will be used
 - once a data store has been encrypted, you can't start an unencrypted instance on it
 - provided key(s) and/or keyfile must match the key(s) and/or keyfile of an encrypted instance
 - see code for implementation


##### Properties:

- object / directory absolute paths (filesystem) are accessed via the _path property, which returns a string of the absolute path

      const Obj = require('@jenselg/obj.js')
      let obj = new Obj()

      console.log(obj.one.two.three._path)
      // '/home/username/obj-store/one/two/three'

- object / directory relative paths (Obj.js instance) are accessed via the _name property, which returns a string of object name(s) / directory path(s) delimited by colons

      const Obj = require('@jenselg/obj.js')
      let obj = new Obj()

      console.log(obj.one.two.three._name)
      // 'obj-store:one:two:three'

- object / directory contents are accessed via the _keys property, which returns an array

      const Obj = require('@jenselg/obj.js')
      let obj = new Obj()

      console.log(obj.one.two.three._keys)
      // []


##### Set data:

- just like a regular object
- data can be created in recursively non-existent paths / directories / objects


##### Get data:

- just like a regular object
- non-existent paths / directories / objects returns an object


##### Delete / update data:

- set the obj.key to undefined, null, or set to other data

      obj.key = undefined
      // folders / files deleted from filesystem, and returns undefined

      obj.key = 'data'
      // replaces value of obj.key with 'data'


### LINKS

##### Github:
https://github.com/jenselg/Obj.js

##### NPM:
https://www.npmjs.com/package/@jenselg/obj.js


### LICENSE

##### MIT License

Copyright (c) 2019 Jensel Gatchalian

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
