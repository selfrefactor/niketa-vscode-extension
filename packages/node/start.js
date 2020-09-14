const { NiketaClient } = require('./index.js')

const niketaClient = new NiketaClient({ port : 3020 })
console.log('ABOUT TO START')
niketaClient.start()
