process.env.NIKETA_NOTIFY = 'true'
process.env.NIKETA_PORT_0 = '3021'
process.env.NIKETA_PORT_1 = '3022'
process.env.NIKETA_PORT_2 = '3023'
// process.env.NIKETA_PORT_3 = '3024'

const { niketaClient } = require('./')

niketaClient()
