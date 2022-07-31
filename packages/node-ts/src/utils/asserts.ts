export function assertString(input: unknown): string {
  if (typeof input !== 'string') throw new Error('assertString')

  return input
}
