import { getter, setter } from 'rambdax'
const NIKETA_LOCK_FLAG = 'NIKETA_LOCK_FLAG'

export function onStart(){
  setter(NIKETA_LOCK_FLAG, true)
}
export function onEnd(){
  setter(NIKETA_LOCK_FLAG, false)
}
export function initLock(){
  setter(NIKETA_LOCK_FLAG, false)
}

export function isLocked(){
  return getter(NIKETA_LOCK_FLAG)
}
