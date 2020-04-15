const { NiketaClient } = require('./index.js')

function startClient(){
  try {
    const niketaClient = new NiketaClient(3020)
    
    niketaClient.start()
  } catch (e) { 
    console.log(e, 'start.niketa.client')
    startClient()  
  }
}

startClient()