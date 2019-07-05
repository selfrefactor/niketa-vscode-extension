import { maybe } from 'rambdax'

export function shouldNotify(flag){

  return maybe(
    process.env.NIKETA_NOTIFY === 'true',
    flag !== false,
    false
  )
}
