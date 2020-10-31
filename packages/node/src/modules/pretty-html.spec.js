import { prettyHtml } from './pretty-html'

test('happy', async () => {
  const path = '/home/s/repos/rambda-docs/src/app/whole/whole.component.html'
  await prettyHtml(path)
})