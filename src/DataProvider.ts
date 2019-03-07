import { ICache } from "miniprogram-cache";
import { IDataFetcher } from "./IDataFetcher";
import { IDataHandler } from "./IDataHandler";
import { ISubscription } from "./ISubscription";

export class DataProvider<T> {
    private static readonly _prefix: string = "$data:";
    private readonly _fetcher: IDataFetcher<T>;
    private readonly _fetchRetention: number = 0;
    private readonly _cache?: ICache = undefined;
    private readonly _cacheKey: string = "";
    private readonly _subscriptions: Array<ISubscription<T>> = new Array<ISubscription<T>>();

    private _lastFetched: number = 0;

    private _loadedFromCache: boolean = false;
    private _data: T = undefined;

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

    public subscribe(subscription: ISubscription<T>
    ): number {
        const handle = this._subscriptions.push(subscription) - 1;
        if (handle == 0) {
            this.getLocal(true); //
        }
        return handle;
    }

    public unsubscribe(handle: number): void {
        this._subscriptions.splice(handle, 1);
    }

    public async getLocal(triggerFetch: boolean = true): Promise<T> {
        if (triggerFetch) {
            this.fetchRemote();
        }
        let data = await this._getLocal();
        return data;
    }

    public async fetchRemote(): Promise<T> {
        if (Date.now() - this._lastFetched < this._fetchRetention) {
            return this._data;
        }

        // fire onFetching
        this.fireFetchingEvent();

        // fetch remote data
        let data = await this._fetcher();

        // fire onRemoteFetched
        this.fireFetchedEvent();

        await this._setLocal(data);

        return data;
    }

    private fireDataChanged(data: T) {
        this._subscriptions.forEach((sub)=>{
            try{
                if(sub.dataHandler){
                    sub.dataHandler(data);
                }
            }
            catch{

            }
        })
    }

    private fireFetchingEvent(){
        this._subscriptions.forEach((sub)=>{
            try{
                if(sub.onFetching){
                    sub.onFetching();
                }
            }
            catch{

            }
        });
    }

    private fireFetchedEvent(){
        this._subscriptions.forEach((sub)=>{
            try{
                if(sub.onFetched)
                {
                    sub.onFetched();
                }
            }
            catch{

            }
        })
    }

    private async _setLocal(data: T): Promise<void> {
        this._data = data;
        if(this._cache !== undefined){
            await this._cache.set(this._cacheKey, data);
        }
        this.fireDataChanged(data);
    }

    private async _getLocal(): Promise<T> {
        if (this._cache !== undefined && !this._loadedFromCache) {
            let data = await this._cache.get(this._cacheKey);
            this._loadedFromCache = true;
            this._data = data;
            this.fireDataChanged(data);
        }
        return this._data;
    }
}
