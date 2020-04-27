import { isLintOnlyMode, lintOnlyMode } from './lint-only-mode'

const base = `${ process.env.HOME }/repos/rambda-docs/src/app/whole`
const html = `${ base }/whole.component.html`

test('html', async () => {
  await lintOnlyMode(html)
})

test('false', () => {
  expect(isLintOnlyMode(`${ process.env.HOME }/s/foo.js`)).toBeFalsy()
})

test('css', () => {
  expect(isLintOnlyMode(`${ process.env.HOME }/s/foo.css`)).toBeTruthy()
})

test('html', () => {
  expect(isLintOnlyMode(`${ process.env.HOME }/s/foo.html`)).toBeTruthy()
})

test('package.json', () => {
  expect(isLintOnlyMode(`${ process.env.HOME }/s/package.json`)).toBeTruthy()
})
