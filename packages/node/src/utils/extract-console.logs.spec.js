import {extractConsoleLogs} from './extract-console.logs'

const testInput = 'console.log src/_modules/parseBeforeNotify.spec.js:10\n' +
        '    string\n' +
        '\n' +
        '  console.log src/_modules/parseBeforeNotify.spec.js:12\n' +
        '    string [ 1, 23, { a: 1 } ]\n' +
        '\n'

test('happy', () => {
  const result = extractConsoleLogs(testInput)
  expect(
    result
  ).toMatchSnapshot()
})        
