import {NiketaClient} from './niketa-client'

export const start = (port = 3020) => {
  const niketaClient = new NiketaClient({ port })
  console.log('ABOUT TO START')
  niketaClient.start()
} 