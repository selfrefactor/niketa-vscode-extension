import { cleanStdout } from './cleanStdout'

const demoStdout = '  console.log node_modules/helpers/src/log/index.js:98\n' +
'       ℹ /home/s/repos/joke-maker/src/app/rough-demo/rough-demo.component.html linted with PrettyHTML\n' +
'\n' +
'-------------------|---------|----------|---------|---------|-------------------\n' +
'File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s \n' +
'-------------------|---------|----------|---------|---------|-------------------\n' +
'All files          |     100 |      100 |     100 |     100 |                   \n' +
' prettyHtmlMode.js |     100 |      100 |     100 |     100 |                   \n' +
'-------------------|---------|----------|---------|---------|-------------------\n'

test('happy', () => {
  const result = cleanStdout(demoStdout)
  console.log({ result })
})
