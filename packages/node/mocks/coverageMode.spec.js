import { setter } from 'rambdax'

import { angularMock } from './angular.js'
import { coverageMode } from '../src/coverageMode'

const filePathSpec =
  '/home/s/repos/joke-maker-angular/src/app/helpers/foo.spec.ts'
const filePath =
  '/home/s/repos/joke-maker-angular/src/app/helpers/foo.spec.ts'

test('happy', () => {
  Boolean(setter('electron.connected'))
  const emit = jest.fn()
  const notify = jest.fn()
  const notifyClose = jest.fn()
  const fileName = 'foo'

  coverageMode({
    emit,
    execResult    : angularMock,
    fileName,
    filePath      : filePathSpec,
    maybeSpecFile : filePathSpec,
    notify,
    notifyClose,
  })
  console.log(emit.mock.calls.length)
  expect(emit.mock.calls).toMatchSnapshot()
})
