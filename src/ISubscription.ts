import { IDataHandler } from "./IDataHandler";

export interface ISubscription<T>{
    dataHandler: IDataHandler<T>,
    onFetching?: Function,
    onFetched?: Function
}