import { outputJson, readJson } from 'fs-extra'
import { omit, replace } from 'rambdax'

const ORDER = [
  'name',
  'scripts',
  'typings',
  'main',
  'version',
  'dependencies',
  'devDependencies',
  'jest',
  'files',
  'repository',
  'license',
  'git',
  'author',
  'depFn',
]

export async function sortPackageJson(location, options = {}){
  const { testing } = options
  const unsorted = await readJson(location)
  const ignored = omit(ORDER, unsorted)

  const sorted = {}

  ORDER.forEach(property => {
    if (unsorted[ property ] === undefined) return

    sorted[ property ] = unsorted[ property ]
  })

  const toSave = {
    ...sorted,
    ...ignored,
  }
  const output = testing ?
    replace(
      '.json', '-sorted.json', location
    ) :
    location

  await outputJson(
    output, toSave, { spaces : 2 }
  )
}
