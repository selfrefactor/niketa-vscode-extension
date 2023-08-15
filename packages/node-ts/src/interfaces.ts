export interface Message {
  fileName: string,
  dir: string,
  hasTypescript: boolean,
  requestLintFile: boolean,
  requestThirdCommand: boolean,
  altLintMode: boolean,
}

export interface ExecResult {
  stderr: string,
  stdout: string,
}

export interface GetNewDecorations {
  execResult: ExecResult,
  fileName: string,
  hasTypescript: boolean,
}

export interface JestSuccessMessage {
  execResult: ExecResult,
  specFile: string,
  dir: string,
  actualFileName: string,
  fileName: string,
  extension: string,
  hasTypescript: boolean,
}

export interface ParseCoverage {
  fileName: string,
  extension: string,
  actualFileName: string,
  execResult: ExecResult,
  hasError: boolean,
}

export interface EvaluateDecorations {
  newDecorationsData: any[],
  fileName: string,
  hasTypescript: boolean,
}

export interface NiketaClientInput {
  port: number,
  testing?: boolean,
  emit?: (x: any) => void,
}
