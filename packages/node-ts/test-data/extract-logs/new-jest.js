export const newJest = `  console.log
{ type: 'object' }

  at Object.<anonymous> (libs/sort-package-json/sort-package-json.spec.js:6:11)

console.log
{ array: 'not array' }

  at Object.<anonymous> (libs/sort-package-json/sort-package-json.spec.js:7:11)

console.log
{ keys: [ 'unsortedKeys', 'sortedKeys' ] }

  at Object.<anonymous> (libs/sort-package-json/sort-package-json.spec.js:8:11)

console.log
{
  unsortedKeys: [
    'name',
    'version',
    'description',
    'author',
    'license',
    'scripts',
    'dependencies',
    'devDependencies',
    'depFn',
    'jest',
    'commitMessage'
  ],
  sortedKeys: [
    'name',
    'scripts',
    'author',
    'version',
    'description',
    'license',
    'dependencies',
    'devDependencies',
    'depFn',
    'jest',
    'commitMessage'
  ]
}

  at Object.<anonymous> (libs/sort-package-json/sort-package-json.spec.js:9:11)

console.log
  { type: 'boolean' }
  
  at Object.<anonymous> (libs/sort-package-json/sort-package-json.spec.js:6:11)

----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------------|---------|----------|---------|---------|-------------------
All files             |   92.31 |       60 |     100 |   91.67 |                   
sort-package-json.js |   92.31 |       60 |     100 |   91.67 | 29                
----------------------|---------|----------|---------|---------|-------------------
`

export const bug = `console.log
1

  at Object.<anonymous> (src/_modules/format-json.spec.js:150:10)

console.log
[ 1, 2, 3 ]

  at Object.<anonymous> (src/_modules/format-json.spec.js:151:10)

console.log
{ a: 1 }

  at Object.<anonymous> (src/_modules/format-json.spec.js:152:10)

----------------|---------|----------|---------|---------|-------------------
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------|---------|----------|---------|---------|-------------------
All files       |   83.33 |      100 |     100 |   83.33 |                   
format-json.js |   83.33 |      100 |     100 |   83.33 | 10                
----------------|---------|----------|---------|---------|-------------------`
