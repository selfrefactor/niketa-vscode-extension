import {prettyHtml} from './pretty-html'

test('happy', async () => {
  const path =
    '/home/sr/repos/secret-services/packages/bot-teacher/client/index.html'
  await prettyHtml(path)
})
