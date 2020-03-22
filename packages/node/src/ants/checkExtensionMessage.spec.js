import { checkExtensionMessage } from './checkExtensionMessage.js'

test('happy', () => {
  const message = {
    dir      : '/home/matrix/repos/stories',
    filePath : '/home/matrix/repos/stories/src/ants/uuid.spec.js',
    // filePath : { fileName : '/home/matrix/repos/stories/src/ants/uuid.spec.js' },
    mode     : 'LOCK_FILE',
  }

  console.log(checkExtensionMessage(message))
})
