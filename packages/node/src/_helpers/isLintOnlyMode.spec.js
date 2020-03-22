import { isLintOnlyMode } from './isLintOnlyMode.js'

test('false', () => {
  expect(isLintOnlyMode(`${ process.env.HOME }/s/foo.js`)).toBeFalsy()
})

test('css', () => {
  expect(isLintOnlyMode(`${ process.env.HOME }/s/foo.css`)).toBeTruthy()
})

test('css', () => {
  expect(isLintOnlyMode(`${ process.env.HOME }/s/foo.html`)).toBeTruthy()
})
