<p align="center">
  <img src="https://github.com/jenselg/obfs/raw/master/misc/obfs-logo.png" alt="obfs-logo" width="300" />
</p>

<h2 align="center">File-based, object-oriented data store for Node.js</h2>

### FEATURES

- use Javascript objects and object notation to read / write from the filesystem / datastore
- symmetric encryption of data using multiple keys
- read / write permissions for instances
- pure Node.js, no third-party libraries
- tested on Linux and MacOS


### INSTALLATION

    npm install --save obfs

### HOW TO USE

##### Create new instance:

- require in your project:

      const OBFS = require('obfs')
      let obfs = new OBFS(options)


- options argument is optional, see below


##### Instance options:

- options should be an object:

      { name: 'obfs', path: '/some/path' }


- name of the obfs instance / folder, defaults to 'obfs':

      options.name = 'string'


- base path where to store obfs instance / folder, defaults to user home directory:

      options.path = 'string'


- encoding used for data, defaults to 'utf8':

      options.encoding = 'string'


- boolean for returning functions as a function (true) or as a string (false), defaults to false:

      options.functions = boolean


- set read/write permissions for obfs instance, defaults to 'rw':

      options.permissions = 'string'


- permissions options:
  - read only: 'r'
  - write only: 'w'
  - read and write: 'rw'


- set encryption for obfs instance:

      options.encryption = {}
      options.encryption.algorithm = 'string'
      options.encryption.key = 'string'
      options.encryption.keyfile = '/path/to/keyfile'


- encryption options:
  - available algorithms: 'aes256', 'aria256', 'camellia256'
  - key(s) formats:
    - 'key'
        - string
        - single-level encryption
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

      const OBFS = require('obfs')
      let obfs = new OBFS()

      console.log(obfs.one.two.three._path)
      // '/home/username/obfs/one/two/three'


- object / directory relative paths (OBFS instance) are accessed via the _name property, which returns a string of object name(s) / directory path(s) delimited by colons

      const OBFS = require('obfs')
      let obfs = new OBFS()

      console.log(obfs.one.two.three._name)
      // 'obfs:one:two:three'


- object / directory contents are accessed via the _keys property, which returns an array

      const OBFS = require('obfs')
      let obfs = new OBFS()

      console.log(obfs.one.two.three._keys)
      // []


##### Set data:

- just like a regular object
- data can be created in recursively non-existent paths / directories / objects


##### Get data:

- just like a regular object
- non-existent paths / directories / objects returns an object


##### Delete / update data:

- set the obfs.key to undefined, null, or set to other data

      obfs.key = undefined
      // folders / files deleted from filesystem, and returns undefined

      obfs.key = 'data'
      // replaces value of obfs.key with 'data'


### LINKS

##### Github:
https://github.com/jenselg/obfs

##### NPM:
https://www.npmjs.com/package/obfs


### LICENSE

MIT License

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
