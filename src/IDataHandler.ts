export interface IDataHandler<T>{
    (data: T): void;
}