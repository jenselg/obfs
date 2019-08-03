// Libraries

const faker = require('faker')
const Obj = require('@jenselg/obj.js')

// Init Obj.js

console.log('\n>> Start Obj.js nested-data-replication example...\n')

let obj = new Obj({ path: __dirname, name: 'data' })

// Reset data

obj.first = {}
obj.second = {}
obj.third = {}
obj.iterator = {}

// Generate data using faker.js

console.time('Generate data on obj.first')

for (i = 0; i <= 100; i++)
{
  let fullName = faker.fake("{{name.lastName}}-{{name.firstName}}")
  obj.first[fullName] = faker.helpers.createCard()
}

console.timeEnd('Generate data on obj.first')

// Replicate data to other objects

console.time('Replicate data from obj.first to obj.second')
obj.second = obj.first
console.timeEnd('Replicate data from obj.first to obj.second')

console.time('Replicate data from obj.second to obj.third')
obj.third = obj.second
console.timeEnd('Replicate data from obj.second to obj.third')

console.time('Replicate data through an iterator')

for (j = 0; j <= 10; j++)
{
  obj.iterator[j] = obj.first
}

console.timeEnd('Replicate data through an iterator')

// End example

console.log('\n>> End Obj.js nested-data-replication example.\n')
