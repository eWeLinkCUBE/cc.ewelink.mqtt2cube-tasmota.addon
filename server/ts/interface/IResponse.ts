export default interface IResponse<T> {
    error: number,
    msg?: string,
    data?: T
}
