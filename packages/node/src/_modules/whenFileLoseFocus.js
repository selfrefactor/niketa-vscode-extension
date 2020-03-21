import { lintAnt } from '../ants/lint'

export async function whenFileLoseFocus(filePath, disableLint){
  if (disableLint) return
  await lintAnt(filePath)
}
