import { TemplateId } from './templates'

type ExecutionResultBase = {
  id: string
}

export type ExecutionError = {
  name: string
  message: string
  stack?: string
}

export type CellResult = {
  type: 'text' | 'image' | 'html' | 'error'
  content: string
  mimeType?: string
}

export type ExecutionResultInterpreter = ExecutionResultBase & {
  template: 'code-interpreter-v1'
  stdout: string[]
  stderr: string[]
  runtimeError?: ExecutionError
  cellResults: CellResult[]
}

export type ExecutionResultWeb = ExecutionResultBase & {
  template: Exclude<TemplateId, 'code-interpreter-v1'>
  url: string
}

export type ExecutionResult = ExecutionResultInterpreter | ExecutionResultWeb
