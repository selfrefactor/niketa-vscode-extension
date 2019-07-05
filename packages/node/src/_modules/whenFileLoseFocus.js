import {lintAnt} from '../ants/lint'

export async function whenFileLoseFocus(filePath){
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')){
    await lintAnt(filePath)
  }
}
