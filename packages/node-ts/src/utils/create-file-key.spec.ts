import {createFileKey} from './create-file-key'

test('with .js', () => {
  expect(createFileKey('foo.js')).toBe('foo.spec.js')
})

test('with spec.js', () => {
  expect(createFileKey('foo.spec.js')).toBe('foo.spec.js')
})
