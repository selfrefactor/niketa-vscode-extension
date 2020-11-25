export const testInput =
  'console.log src/_modules/parseBeforeNotify.spec.js:10\n' +
  '    string\n' +
  '\n' +
  '  console.log src/_modules/parseBeforeNotify.spec.js:12\n' +
  '    string [ 1, 23, { a: 1 } ]\n' +
  '\n'

export const testInputSecond = `
console.log source/adjust.js:6
1 [ 0, 1, 2 ]

console.log source/adjust.js:6
1 [ 0, 1, 2 ]

console.log source/adjust.js:6
1 [ 0, 1, 2 ]

console.log source/adjust.js:6
1 [ 0, 1, 2 ]

console.log source/adjust.js:6
-2 [ 0, 1, 2 ]

console.log source/adjust.js:6
4 [ 0, 1, 2, 3 ]

console.log source/adjust.js:6
-5 [ 0, 1, 2, 3 ]

-----------|---------|----------|---------|---------|-------------------
File       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------|---------|----------|---------|---------|-------------------
All files  |     100 |      100 |     100 |     100 |                   
adjust.js |     100 |      100 |     100 |     100 |                   
-----------|---------|----------|---------|---------|-------------------
`.trim()

export const testInputThird = `
console.log
object

  at Object.<anonymous> (libs/sort-package-json/sort-package-json.spec.js:5:11)

----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------------|---------|----------|---------|---------|-------------------
All files             |   93.75 |       60 |     100 |   93.33 |                   
sort-package-json.js |   93.75 |       60 |     100 |   93.33 | 29                
----------------------|---------|----------|---------|---------|-------------------

`.trim()
