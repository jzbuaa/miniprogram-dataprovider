import { ICache } from "miniprogram-cache";
import { DataProvider } from "./DataProvider";
import { IDataFetcher } from "./IDataFetcher";
import { IDataHandler } from "./IDataHandler";
import { IPostFetchHandler } from "./IPostFetchHandler"

export class DataProviderBuilder<T> {
    private _initialValue: T| undefined = undefined;
    private _fetcher: IDataFetcher<T>;
    private _fetchRetention: number = 0;
    private _cache: ICache | undefined;
    private _cacheKey: string | undefined;
    private _postFetch: IPostFetchHandler<T> | undefined;

    public constructor(fetcher: IDataFetcher<T>) {
        if (!fetcher) {
            throw new Error("invalid fetcher");
        }
        this._fetcher = fetcher;
        return this;
    }

    public setInitialValue(f: () => T): DataProviderBuilder<T> {
        this._initialValue = f();
        return this;
    }

    public setFetchRetention(retention: number): DataProviderBuilder<T> {
        this._fetchRetention = retention;
        return this;
    }

    public useCache(cache: ICache, cacheKey: string): DataProviderBuilder<T> {
        if (!cache) {
            throw new Error("invalid cache");
        }
        if (!cacheKey) {
            throw new Error("invalid cacheKey");
        }
        this._cache = cache;
        this._cacheKey = cacheKey;
        return this;
    }

    public usePostFetch(f: IPostFetchHandler<T>): DataProviderBuilder<T> {
        this._postFetch = f;
        return this;
    }

    public build(): DataProvider<T> {
        return new DataProvider<T>(
            this._initialValue,
            this._fetcher,
            this._fetchRetention,
            this._postFetch,
            this._cache,
            this._cacheKey
        );
    }
}
