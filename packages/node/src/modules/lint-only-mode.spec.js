import { lintOnlyMode } from './lint-only-mode'

const base = '/home/s/repos/rambda-docs/src/app/whole'
const html = `${ base }/whole.component.html`

test('html', async () => {
  await lintOnlyMode(html)
})
