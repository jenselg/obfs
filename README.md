### DESCRIPTION

    File-based object datastore system for Node.js.
    Use Javascript objects to set or get data and Javascript functions in the filesystem.

    By: Jensel Gatchalian
    Github: https://github.com/jenselg/Obj.js
    License: MIT

### HOW TO USE

##### Create new instance:
    
    var obj = new Obj(options)
    
    Options:
    
    options.path = 'string' 
    - base path where to store obj instance / folder
    - defaults to the user home directory
    
    options.name = 'string'
    - name of the obj instance / folder, folder names end in .obj automatically
    - defaults to 'default'
    
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
    
    Objects:
    obj.key = {}
    obj.key.nested = 'nested'

##### Get data:

    - Same as a regular Javascript object, returns the data on declare
    
    obj.key
    
##### Delete data:

    - Set the obj.key to undefined to delete the data from the filesystem
    
    obj.key = undefined
