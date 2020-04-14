import { extractConsoleLogs } from './extract-console.logs'

const testInput =
  'console.log src/_modules/parseBeforeNotify.spec.js:10\n' +
  '    string\n' +
  '\n' +
  '  console.log src/_modules/parseBeforeNotify.spec.js:12\n' +
  '    string [ 1, 23, { a: 1 } ]\n' +
  '\n'

const testInputSecond = `
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

test('happy', () => {
  const result = extractConsoleLogs(testInput)
  expect(result).toMatchSnapshot()
})

test.only('multiple logs on same line', () => {
  const result = extractConsoleLogs(testInputSecond)
  expect(result).toMatchSnapshot()
})
