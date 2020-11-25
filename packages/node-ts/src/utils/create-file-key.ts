import {last, replace} from 'rambdax'

export function createFileKey(x: string) {
  const extension = last(x.split('.'))

  return x.endsWith(`.spec.${extension}`)
    ? x
    : replace(`.${extension}`, `.spec.${extension}`, x)
}
