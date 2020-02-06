import { createFileKey } from './createFileKey'

test('with .js', () => {
  expect(createFileKey('foo.js')).toBe('foo.spec.js')
})

test('with .jsx', () => {
  expect(createFileKey('foo.jsx')).toBe('foo.spec.jsx')
})

test('with spec.js', () => {
  expect(createFileKey('foo.spec.js')).toBe('foo.spec.js')
})

test('with spec.jsx', () => {
  expect(createFileKey('foo.spec.jsx')).toBe('foo.spec.jsx')
})
