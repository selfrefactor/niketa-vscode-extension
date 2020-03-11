import { parseBeforeNotify } from './parseBeforeNotify'

test('happy', () => {
  const demoInput = `console.log node_modules/helpers/src/log/index.js:98
  ℹ /home/s/repos/joke-maker/src/app/rough-demo/rough-demo.component.html linted with PrettyHTML

--------------|----------|---------|---------|-------------------
`
  const result = parseBeforeNotify(demoInput)
  expect(result).toMatchInlineSnapshot('')
})
