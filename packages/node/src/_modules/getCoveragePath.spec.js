import { getCoveragePath } from './getCoveragePath'

test('spec.ts', () => {
  const [ result, fileName ] = getCoveragePath('home/sk/', 'home/sk/foo/bar.spec.ts')
  console.log({ result })
  expect(fileName).toBe('bar')
  expect(result.endsWith('"home/sk/foo/bar.ts"')).toBe(true)
})

test('.ts', () => {
  const [ result, fileName ] = getCoveragePath('home/sk/', 'home/sk/foo/bar.ts')
  console.log({ result })
  expect(fileName).toBe('bar')
  expect(result.endsWith('"home/sk/foo/bar.ts"')).toBe(true)
})

test('spec.js', () => {
  const [ result, fileName ] = getCoveragePath('home/sk/', 'home/sk/foo/bar.spec.js')
  console.log({ result })
  expect(fileName).toBe('bar')
  expect(result.endsWith('"home/sk/foo/bar.js"')).toBe(true)
})

test('.js', () => {
  const [ result, fileName ] = getCoveragePath('home/sk/', 'home/sk/foo/bar.js')
  console.log({ result })
  expect(fileName).toBe('bar')
  expect(result.endsWith('"home/sk/foo/bar.js"')).toBe(true)
})
