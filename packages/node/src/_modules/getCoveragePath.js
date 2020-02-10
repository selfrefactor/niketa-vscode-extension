import { endsWith, last, remove, switcher } from 'rambdax'

export function getCoveragePath(dir, filePath){
  const extension = switcher(filePath)
    .is(endsWith('.tsx'), '.tsx')
    .is(endsWith('.ts'), '.ts')
    .is(endsWith('.jsx'), '.jsx')
    .default('.js')

  const file = remove([ `${ dir }/`, '.spec', extension ], filePath)
  const fileName = last(file.split('/'))

  return [ `--collectCoverageFrom="${ file }${ extension }"`, fileName ]
}
