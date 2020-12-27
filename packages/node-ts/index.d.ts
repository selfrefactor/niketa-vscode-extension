interface NiketaClientInput{
  port: number
  testing?: boolean
  emit?: (x: any) => void
}

interface Message{
  fileName: string 
  dir: string
  hasTypescript: boolean
  requestLintFile: boolean
  forceLint: boolean
}

export function start(port?: number): Promise<void>