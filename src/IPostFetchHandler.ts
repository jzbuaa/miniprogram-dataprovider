export interface IPostFetchHandler<T>{
    (oldValue: T | undefined, fetched: T): Promise<T>;
}