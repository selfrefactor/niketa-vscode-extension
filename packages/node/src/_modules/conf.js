import { maybe } from 'rambdax'
let config

const listOfKeys = [
  'PORT_0',
  'PORT_1',
  'PORT_2',
  'PORT_3',
]
const listOfDefaults = [
  3011,
  3012,
  3013,
  3014,
]

function init(){
  if (config) return

  config = {}
  listOfKeys.forEach((key, defaultsIndex) => config[ key ] = maybe(
    process.env[ `NIKETA_${ key }` ],
    Number(process.env[ `NIKETA_${ key }` ]),
    listOfDefaults[ defaultsIndex ]
  ))
  if (process.env.LOG) console.log(config)
}

export function conf(key){
  init()

  return config[ key ]
}
