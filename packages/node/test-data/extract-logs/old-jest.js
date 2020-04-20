export const oldJest = `  console.log libs/sort-package-json/sort-package-json.spec.js:6
{ type: 'object' }

console.log libs/sort-package-json/sort-package-json.spec.js:7
{ array: 'not array' }

console.log libs/sort-package-json/sort-package-json.spec.js:8
{ keys: [ 'unsortedKeys', 'sortedKeys' ] }

console.log libs/sort-package-json/sort-package-json.spec.js:9
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

----------------------|----------|----------|----------|----------|-------------------|
File                  |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
----------------------|----------|----------|----------|----------|-------------------|
All files             |    92.31 |       60 |      100 |    91.67 |                   |
sort-package-json.js |    92.31 |       60 |      100 |    91.67 |                29 |
----------------------|----------|----------|----------|----------|-------------------|
`