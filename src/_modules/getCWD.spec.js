const {getCWD} = require('./getCWD')

test('', () => {
  const input = '/home/s/repos/niketa/src/_helpers/getCWD.spec.js'
  const expected = '/home/s/repos/niketa'

  expect(
    getCWD(input)
  ).toBe(expected)
})