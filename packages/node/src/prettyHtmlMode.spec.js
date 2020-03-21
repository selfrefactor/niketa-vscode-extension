import { prettyHtmlMode } from './prettyHtmlMode'

const demoPath =
  '/home/s/repos/joke-maker/src/app/rough-demo/rough-demo.component.html'

test('happy', async () => {
  await prettyHtmlMode(demoPath)
})
