import { sortPackageJson } from './sort-package-json'

test('happy', async () => {
  const mode = 'bar'
  await sortPackageJson(`${ __dirname }/test-assets/${ mode }.json`, { testing : true })
})
