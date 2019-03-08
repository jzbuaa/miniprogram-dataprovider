export interface IDataHandler<T>{
    (data: Readonly<T>): void;
}