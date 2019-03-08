import { ICache } from "miniprogram-cache";
import { IDataFetcher } from "./IDataFetcher";
import { ISubscription } from "./ISubscription";

export class DataProvider<T> {
    private static readonly _prefix: string = "$data:";
    private readonly _fetcher: IDataFetcher<T>;
    private readonly _fetchRetention: number = 0;
    private readonly _cache?: ICache = undefined;
    private readonly _cacheKey: string = "";
    private readonly _subscriptions: Array<ISubscription<T>> = new Array<
        ISubscription<T>
    >();

    private _lastFetched: number = 0;

    private _loadedFromCache: boolean = false;
    private _data?: T = undefined;
   // private _dataLoaded: boolean = false;
    private _fetching: boolean = false;
    private _fetchPromise?: Promise<T> = undefined;

    public constructor(
        fetcher: IDataFetcher<T>,
        fetchRetention: number = 0,
        cache?: ICache,
        cacheKey?: string
    ) {
        this._fetcher = fetcher;
        this._fetchRetention = fetchRetention > 0 ? fetchRetention : 0;
        if (cache) {
            this._cache = cache;
            if (!cacheKey) {
                throw new Error("invalid cacheKey");
            } else {
                this._cacheKey = DataProvider._prefix + cacheKey;
            }
        }
    }

    public subscribe(subscription: ISubscription<T>): number {
        const handle = this._subscriptions.push(subscription) - 1;
        if (this._data === undefined) {
            this.loadData();
        } else {
            this.invokeDataChanged(subscription);
        }

        return handle;
    }

    public unsubscribe(handle: number): void {
        this._subscriptions.splice(handle, 1);
    }

    public async getLocal(
        triggerFetch: boolean = true
    ): Promise<T | undefined> {
        if (triggerFetch) {
            this.fetchRemote();
        }
        if (this._cache !== undefined && !this._loadedFromCache) {
            let data = await this._cache.get(this._cacheKey);
            this._loadedFromCache = true;
            this._data = data;
            this.fireDataChangedEvent(data);
        }
        return this._data;
    }

    public async setLocal(data: T): Promise<void> {
        this._data = data;
        if (this._cache) {
            await this._cache.set(this._cacheKey, data);
        }
        this.fireDataChangedEvent(data);
    }

    public async fetchRemote(): Promise<T | undefined> {
        if (Date.now() - this._lastFetched < this._fetchRetention) {
            return this._data;
        }

        if (this._fetching && this._fetchPromise) {
            return this._fetchPromise;
        }

        this._fetchPromise = this.innerFetchRemote();

        return this._fetchPromise;
    }

    private async innerFetchRemote(): Promise<T> {
        try {
            this._fetching = true;
            // fire onFetching
            this.fireFetchingEvent();
            this._data = await this._fetcher();
            this._lastFetched = Date.now();
            this._fetching = false;

            // set local
            if (this._cache !== undefined) {
                await this._cache.set(this._cacheKey, this._data);
            }

            this.fireFetchedEvent();

            

            return this._data;
        } catch (err) {
            this._fetching = false;
            this.fireFetchErrorEvent(err);
            throw err;
        }
    }

    private async loadData(): Promise<void> {
        if (this._cache !== undefined && !this._loadedFromCache) {
            let data = await this._cache.get(this._cacheKey);
            this._loadedFromCache = true;
            if (data !== undefined) {
                this.fireDataChangedEvent(data);
            } else {
                await this.fetchRemote();
            }
        } else {
            await this.fetchRemote();
        }
    }

    private invokeDataChanged(sub: ISubscription<T>) {
        if (this._data === undefined) {
            return;
        } else {
            try {
                sub.dataHandler && sub.dataHandler(this._data);
            } catch (err) {
                sub.onError && sub.onError(err);
            }
        }
    }

    private fireDataChangedEvent(data: T) {
        if (data === undefined) {
            return;
        } else {
            this._data = data;
            this._subscriptions.forEach(sub => {
                this.invokeDataChanged(sub);
            });
        }
    }

    private invokeFetching(sub: ISubscription<T>) {
        try {
            sub.onFetching && sub.onFetching();
        } catch (err) {
            sub.onError && sub.onError(err);
        }
    }

    private fireFetchingEvent() {
        this._subscriptions.forEach(sub => {
            this.invokeFetching(sub);
        });
    }

    private invokeFetched(sub: ISubscription<T>) {
        if(this._data === undefined){
            return;
        }
        try {
            sub.onFetched && sub.onFetched(this._data);
        } catch (err) {
            sub.onError && sub.onError(err);
        }
    }

    private fireFetchedEvent() {
        this._subscriptions.forEach(sub => {
            if (sub.onFetched) {
                this.invokeFetched(sub);
            } else {
                this.invokeDataChanged(sub);
            }
        });
    }

    private invokeFetchError(sub: ISubscription<T>, err: any) {
        try {
            sub.onFetchError && sub.onFetchError(err);
        } catch {}
    }

    private fireFetchErrorEvent(err: any) {
        this._subscriptions.forEach(sub => {
            this.invokeFetchError(sub, err);
        });
    }
}
