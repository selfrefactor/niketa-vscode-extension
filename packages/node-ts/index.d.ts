interface NiketaClientInput{
  port: number
  testing?: boolean
  emit?: object
}

interface Message{
  fileName: string 
  dir: string
  hasTypescript: boolean
  requestLintFile: boolean
  forceLint: boolean
}