import { replace, last } from 'rambdax'

export function createFileKey(x){
  const extension = last(x.split('.'))

  return x.endsWith(`.spec.${ extension }`) ?
    x :
    replace(`.${ extension }`, `.spec.${ extension }`, x)
}
