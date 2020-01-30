const { getSize } = require('./getSize')

void (async function recalculate(){
  await getSize(true)
})()
