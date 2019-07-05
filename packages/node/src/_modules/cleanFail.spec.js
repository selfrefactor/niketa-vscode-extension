import { cleanFail } from './cleanFail'
import { readFileSync } from 'fs'

test('', () => {
  const text = readFileSync(`${ process.cwd() }/log.txt`).toString()
  const expectedResult = readFileSync(
    `${ process.cwd() }/expected.txt`
  ).toString()

  const result = cleanFail(text)

  expect(result).toEqual(expectedResult)
})
