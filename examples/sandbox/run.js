const Obj = require('../../obj.js')
//const Obj = require('@jenselg/obj.js')
let obj = new Obj({path: __dirname, async: true, permissions: 'rw' })

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
console.log(obj.string = {nested: {nestedstr: 'str'},somedata: 'somedata', somefn: () => { console.log('test string inside fn') }})

console.log('\n GET:')
//console.log(obj)
console.log(obj.string)
obj.string.then((data) =>
{
  console.log(data)
  data.nested.then((dataN) =>
  {
    console.log(dataN.nestedstr.then((dataR) => {console.log(dataR)}))
  })
})

// obj.nums = {}
// console.time('simple write')
// for (i=0;i<=1000;i++)
// {
//   console.log(`${i}:`)
//   console.log(obj.nums[i] = 'stringdata')
// }
// console.timeEnd('simple write')
