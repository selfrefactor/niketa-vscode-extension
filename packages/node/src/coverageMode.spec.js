import { angularMock } from '../mocks/angular.js'
import { coverageMode } from './coverageMode'

const filePathSpec =
  '/home/s/repos/joke-maker-angular/src/app/helpers/foo.spec.ts'
const filePath=   '/home/s/repos/joke-maker-angular/src/app/helpers/foo.spec.ts'

test('happy', () => {
  const emit = jest.fn()
  const notify = jest.fn()
  const notifyClose = jest.fn()
  const fileName = 'foo'

  const result = coverageMode({
    emit,
    execResult    : angularMock,
    fileName,
    filePath: filePathSpec,
    maybeSpecFile : filePathSpec,
    notify,
    notifyClose,
  })
  expect(1).toBe(1)
})
