export interface IDataFetcher<T> {
    (): Promise<T>;
}
