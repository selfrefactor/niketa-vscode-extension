import { readFileSync } from 'fs'

import { cleanFail } from './cleanFail'

test('', () => {
  const text = readFileSync(`${ process.cwd() }/log.txt`).toString()
  const expectedResult = readFileSync(`${ process.cwd() }/expected.txt`).toString()

  const result = cleanFail(text)

  expect(result).toEqual(expectedResult)
})
