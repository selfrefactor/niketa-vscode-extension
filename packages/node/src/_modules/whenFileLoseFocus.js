import {lintAnt} from '../ants/lint'

export async function whenFileLoseFocus(filePath, disableLint){
  if(disableLint) return
  
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')){
    await lintAnt(filePath)
  }
}
