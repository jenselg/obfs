const Obj = require('../../obj.js')
//const Obj = require('@jenselg/obj.js')
let obj = new Obj({ path: __dirname, name: 'data', async: false })

// console.log(obj)
//
// console.log('\n SET:')
// console.log(obj.string = 'base string')
// console.log(obj.fn = () => {})
// console.log(obj.nested = {str: 'nested string', func: () => { console.log('test function exec') }})

console.log('\n GET:')
//console.log(obj)
console.log(obj.nested)
