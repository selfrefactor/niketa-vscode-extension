import { angularMock } from '../../mocks/angular.js'
import { parseCoverage } from './parseCoverage.js'

const filePathSpec =
  '/home/s/repos/joke-maker-angular/src/app/helpers/foo.spec.ts'
const filePath =
  '/home/s/repos/joke-maker-angular/src/app/helpers/foo.spec.ts'

test('happy', () => {
  const fileName = 'foo'

  const result = parseCoverage(angularMock, fileName, filePathSpec)
  console.log(result)
  // expect(1).toBe(1)
})
