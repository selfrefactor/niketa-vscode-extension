const { getSpecFilePath } = require('./get-spec-file-path')
let { resolve } = require('path')

test('happy', () => {
  let directory = resolve (__dirname, '..')
  let testInputs = [
    'src/utils.js',
    'src/get-spec-file-path.js',
    'src/get-spec-file-path.spec.js',
    'src/foo.js',
    'src/foo.spec.js',
  ]
  let result = testInputs.map(x => getSpecFilePath(x, directory))
  expect(
  result
).toMatchInlineSnapshot(`
[
  false,
  "src/get-spec-file-path.spec.js",
  "src/get-spec-file-path.spec.js",
  false,
  "src/foo.spec.js",
]
`)
})