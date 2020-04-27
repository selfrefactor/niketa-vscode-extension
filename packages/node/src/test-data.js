import { resolve } from 'path'

export const throwingSyncTest = resolve(__dirname,
  '../test-data/failed-code/sync.js')
export const throwingAsyncTest = resolve(__dirname,
  '../test-data/failed-code/async.js')
const angularDir = resolve(__dirname, '../../../../rambda-docs')
const typescriptDir = resolve(__dirname,
  '../../../../services/packages/tag-fn')
const typescriptSpec = resolve(__dirname,
  '../../../../services/packages/tag-fn/src/modules/getNextTag.spec.ts')
const typescriptFile = resolve(__dirname,
  '../../../../services/packages/tag-fn/src/modules/getNextTag.ts')

const htmlFile = resolve(__dirname,
  '../../../../rambda-docs/src/app/whole/whole.component.html')
const angularFile = resolve(__dirname,
  '../../../../rambda-docs/src/app/helpers/foo.ts')
const angularSpec = resolve(__dirname,
  '../../../../rambda-docs/src/app/helpers/foo.spec.ts')
const scssFile = resolve(__dirname,
  '../../../../rambda-docs/src/styles.scss')

export const ANGULAR = {
  dir : angularDir,
  htmlFile,
  angularFile,
  angularSpec,
  scssFile,
}

export const TYPESCRIPT = {
  dir : typescriptDir,
  typescriptFile,
  typescriptSpec,
}

export const FAILED_EXPECTATIONS = {
  specHasLogsFile : resolve(__dirname,
    '../test-data/failed-expectation/spec-has-logs.js'),
  specHasLogsSpec : resolve(__dirname,
    '../test-data/failed-expectation/spec-has-logs.spec.js'),
  fileHasLogsFile : resolve(__dirname,
    '../test-data/failed-expectation/file-has-logs.js'),
  fileHasLogsSpec : resolve(__dirname,
    '../test-data/failed-expectation/file-has-logs.spec.js'),
  bothHaveLogsFile : resolve(__dirname,
    '../test-data/failed-expectation/both-have-logs.js'),
  bothHaveLogsSpec : resolve(__dirname,
    '../test-data/failed-expectation/both-have-logs.spec.js'),
}

export const SUCCESS = {
  specHasLogsFile : resolve(__dirname,
    '../test-data/success/spec-has-logs.js'),
  specHasLogsSpec : resolve(__dirname,
    '../test-data/success/spec-has-logs.spec.js'),
  fileHasLogsFile : resolve(__dirname,
    '../test-data/success/file-has-logs.js'),
  fileHasLogsSpec : resolve(__dirname,
    '../test-data/success/file-has-logs.spec.js'),
  bothHaveLogsFile : resolve(__dirname,
    '../test-data/success/both-have-logs.js'),
  bothHaveLogsSpec : resolve(__dirname,
    '../test-data/success/both-have-logs.spec.js'),
}

export const testDir = '/home/s/repos/niketa/packages/node'

export function generateMessage(input){
  return JSON.stringify({
    hasWallaby    : false,
    forceLint     : false,
    hasTypescript : false,
    dir           : testDir,
    ...input,
  })
}

export function getFullSnap({ niketaClient, emit }){
  return {
    lintOnlyFile : niketaClient.lintOnlyFileHolder,
    lintFile     : niketaClient.lintFileHolder,
    emited       : emit.mock.calls,
    linted       : niketaClient.lastLintedFiles,
  }
}
