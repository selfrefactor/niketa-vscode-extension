import {last, remove} from 'rambdax'

export function getCoveragePath(dir, filePath) {
  const extension = filePath.endsWith('.js') ? '.js' : '.ts'

  const file = remove([`${dir}/`, '.spec', extension], filePath)
  const fileName = last(file.split('/'))

  return [`--collectCoverageFrom="${file}${extension}"`, fileName, extension]
}
