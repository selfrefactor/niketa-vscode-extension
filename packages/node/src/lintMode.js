import { lintAnt } from './ants/lint'

// Lint file and send lint output to `niketa-notify`
// ============================================
export async function lintMode({ notify, notifyClose, filePath, okLint }){
  if (!okLint) return console.log('!oklint')

  const logResult = await lintAnt(filePath)

  if (logResult && notifyClose){
    notify(logResult)
    notifyClose()
  }
}
