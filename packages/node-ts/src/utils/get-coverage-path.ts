import {last, remove} from 'rambdax'
import { assertString } from './asserts'

export function getCoveragePath(dir: string, filePath: string): string[]{
  const extension = filePath.endsWith('.js') ? '.js' : '.ts'

  const file = remove([`${dir}/`, '.spec', extension], filePath)
  const fileName = assertString(last(file.split('/')))

  return [`--collectCoverageFrom="${file}${extension}"`, fileName, extension]
}
