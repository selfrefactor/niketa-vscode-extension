import { stylelintMode } from './stylelintMode'

const demoPath = '/home/s/repos/rambda-docs/src/app/grid/grid.component.css'

test('happy', async () => {
  await stylelintMode(demoPath)
})
