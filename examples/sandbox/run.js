const Obj = require('../../obj.js')
//const Obj = require('@jenselg/obj.js')
let obj = new Obj({ path: __dirname, name: 'data', async: false, permissions: 'rw' })

//console.log(obj)
//
// console.log('\n SET:')
// console.log(obj.string = 'base string')
// console.log(obj.fn = () => {})
// console.log(obj.nested = {str: 'nested string', func: () => { console.log('test function exec') }})

//obj.string = 'write only string'
console.log(obj)
//
// console.log('\n GET:')
// //console.log(obj)
// console.log(obj.nested)
// obj.nested.func()
//
console.log('\n SET:')
//console.log(obj.string = 'testasyncwrite')

console.log('\n GET:')
//console.log(obj)
console.log(obj.string)
obj.nums = {}
console.time('simple write')
for (i=0;i<=1000;i++)
{
  console.log(`${i}:`)
  console.log(obj.nums[i] = 'stringdata')
}
console.timeEnd('simple write')
