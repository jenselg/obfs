<p align="center">
  <img src="https://github.com/jenselg/obfs/raw/master/misc/obfs-logo.png" alt="obfs-logo" width="300" />
</p>

<h2 align="center">File-based, object-oriented data store for Node.js</h2>

### FEATURES

- use Javascript objects and object notation to read / write from the filesystem / datastore.
- symmetric encryption of data using multiple keys.
- read / write permissions for instances.
- fuzzy directory-name search, scoped to any directory proxy.
- boolean existence checks without reading file contents.
- synchronous filesystem operations.
- pure Node.js, no third-party libraries.
- tested on Linux and MacOS.

### USE CASES

- **Local application storage** — persist settings, preferences, and application state through familiar object notation.
- **Filesystem navigation** — explore directories, list their contents, and check whether files or folders exist.
- **Directory discovery** — find folders using partial names, normalized text, or fuzzy matches, scoped to any directory.
- **Project organization** — store notes, drafts, reports, and metadata in a hierarchy you can inspect directly on disk.
- **Scripts and automation** — read and update structured data synchronously without setting up a database.
- **Persistent agent memory** — give an agent a directory-based store it can organize, revisit, and search across sessions.
- **Encrypted local storage** — encrypt stored values using a key, multiple keys, or a keyfile.

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

- object / directory absolute paths (filesystem) are accessed via the 'obfs:path' property, which returns a string of the absolute path

      const OBFS = require('obfs')
      let obfs = new OBFS()

      console.log(obfs.one.two.three['obfs:path'])
      // '/home/username/obfs/one/two/three'


- object / directory relative paths (OBFS instance) are accessed via the 'obfs:name' property, which returns a string of object name(s) / directory path(s) delimited by colons

      const OBFS = require('obfs')
      let obfs = new OBFS()

      console.log(obfs.one.two.three['obfs:name'])
      // 'obfs:one:two:three'


- object / directory contents are accessed via the 'obfs:keys' property, which returns an array

      const OBFS = require('obfs')
      let obfs = new OBFS()

      console.log(obfs.one.two.three['obfs:keys'])
      // []


- object / directory timestamp is accessed via the 'obfs:timestamp' property

      const OBFS = require('obfs')
      let obfs = new OBFS()

      console.log(obfs.one.two.three['obfs:timestamp'])
      // 0000-00-00T00:00:00.000Z

##### Existence helpers:

- `obfs:exists` returns a boolean for the current directory proxy, including proxies for paths that do not exist:

```js
obfs.documents = { drafts: {} }

console.log(obfs.documents.drafts['obfs:exists']) // true
console.log(obfs.missing.deep['obfs:exists'])   // false
```

- `obfs:has` checks whether a named child exists, whether it is a file or directory, without reading or decrypting its contents:

```js
obfs.documents.drafts['notes.txt'] = 'Draft notes'

console.log(obfs.documents.drafts['obfs:has']('notes.txt')) // true
console.log(obfs.documents.drafts['obfs:has']('outline.txt'))  // false
```

`obfs:has` accepts a string or number representing a single child name. Empty names, `.` and `..`, slashes, backslashes, colons, and null characters are rejected. To check a nested child, navigate to its parent proxy first.

Files return their stored values when accessed, so use the parent directory's `obfs:has` to check a file. Missing paths return proxies and are truthy; use `obfs:exists` instead of testing the proxy itself. Neither helper creates directories. Both helpers are available on read-only and write-only instances.

##### Fuzzy directory search:

Call `obfs:search` on the instance or any directory proxy to search its descendant directories synchronously:

```js
obfs.documents = {
  'project-notes': { 'meeting-notes': {} },
  'project-reports': { 'annual-reports': {} }
}

console.log(obfs['obfs:search']('project'))
// [
//   { path: 'documents/project-notes', score: 0.95 },
//   { path: 'documents/project-reports', score: 0.95 },
//   { path: 'documents/project-notes/meeting-notes', score: 0.9 },
//   { path: 'documents/project-reports/annual-reports', score: 0.9 }
// ]

console.log(obfs.documents['obfs:search']('PROJECT reports', {
  recursive: false
}))
// [{ path: 'project-reports', score: 1 }]

// Navigate to a matching directory using its relative path:
const [match] = obfs['obfs:search']('meeting notes', { limit: 1 })
if (match) {
  const directory = match.path.split('/').reduce((node, name) => node[name], obfs)
  console.log(directory['obfs:path']) // absolute filesystem path
  console.log(directory['obfs:keys']) // directory contents
}
```

Each result contains a `path` relative to the proxy where the search was called, using `/` separators, and a `score` between 0 and 1. Results are sorted by descending score, then by path for ties. Scores indicate string similarity, not probability or semantic relevance.

Search compares both directory names and their relative paths. It normalizes case, punctuation, and spacing; uses Unicode NFKD normalization and removes combining accents; then applies exact, prefix, substring, token, and subsequence matching. The final normalization keeps only ASCII letters and digits, so non-Latin scripts are discarded. This is directory-name search, not file-content or semantic search.

```js
const matches = obfs['obfs:search']('reports', {
  recursive: true,
  minScore: 0.5,
  limit: 10
})

// Search only immediate child directories:
const children = obfs.documents['obfs:search']('reports', {
  recursive: false
})
```

| Option | Default | Description |
| --- | --- | --- |
| `recursive` | `true` | Include descendant directories; `false` searches immediate children only. |
| `minScore` | `0.5` | Minimum accepted score, a finite number from 0 to 1. Zero-score matches are always excluded. |
| `limit` | `Infinity` | Maximum number of results, a nonnegative integer or `Infinity`. |

- The query must be a string; options must be an object.
- An empty normalized query, a missing search directory, or `limit: 0` returns `[]`.
- The current directory itself is excluded from results.
- Hidden directories and their descendants are skipped; symbolic links are not followed.
- Search reads directory metadata only and does not read or decrypt file contents.
- Search is available on read-only instances; write-only instances throw an error.
- Invalid arguments throw an error. Filesystem errors other than missing paths or non-directory paths are propagated.
- The `obfs:*` names preserve ordinary data keys such as `search`, `exists`, and `has`.

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
