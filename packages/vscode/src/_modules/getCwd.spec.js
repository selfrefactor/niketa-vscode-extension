const { getCwd } = require('./getCwd')

test('', () => {
  const input = '/home/s/repos/niketa/src/_helpers/getCwd.spec.js'
  const expected = '/home/s/repos/niketa'

  expect(getCwd(input)).toBe(expected)
})
