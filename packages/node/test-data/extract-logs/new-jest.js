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
