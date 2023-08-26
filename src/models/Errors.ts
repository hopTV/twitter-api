
type ErrorType = Record<string, {
    msg: string,
    location: string,
    value: any,
    path: string,
    [key: string]: any
}>

export class ErrorWithStatus {
    message: string
    status: number
    constructor({message, status}: {message: string; status: number}) {
        this.message = message
        this.status = status
    }
}