import { IDataHandler } from "./IDataHandler";
import { IErrorHandler } from "./IErrorHandler";

export interface ISubscription<T> {
    dataHandler: IDataHandler<T>;
    onFetching?: Function;
    onFetched?: IDataHandler<T>;
    onFetchError?: IErrorHandler;
    onError?: IErrorHandler;
}
