/// <reference lib="dom" />

import {DataProvider} from "../src/DataProvider";

function fakeFetcher(): Promise<number>{
    return new Promise((resolve)=>{
        setTimeout(() => {
            return resolve(Date.now());
        }, 2000);
    })

}

let dp = new DataProvider<number>(fakeFetcher);

let sub1 = dp.subscribe({
    dataHandler: (data)=>{
        console.log(Date.now(), "sub1", data);
    },
    onFetching: ()=>{
        console.log(Date.now(), "sub1", "onFetching");
    },
    onFetched:()=>{
        console.log(Date.now(), "sub1", "onFetched");
    }
})

let sub2: number;

setTimeout(() => {
    sub2 = dp.subscribe({
        dataHandler: (data)=>{
            console.log(Date.now(), "sub2", data);
        },
        onFetching: ()=>{
            console.log(Date.now(), "sub2", "onFetching");
        },
        onFetched:()=>{
            console.log(Date.now(), "sub2", "onFetched");
        }
    })
}, 3000);


let sub3 = dp.subscribe({
    dataHandler: (data)=>{
        throw new Error("sub3 messed up");
    },
    onFetching: ()=>{
        console.log(Date.now(), "sub3", "onFetching")
    },
    onFetched:()=>{
        console.log(Date.now(), "sub3", "onFetched");
    },
    onFetchError:(err)=>{
        console.log(Date.now(), "sub3", "onFetchError", err);
    },
    onError: (err)=>{
        console.log(Date.now(), "sub3", "onError", err);
    }
})

setTimeout(() => {
    dp.unsubscribe(sub2);
}, 10000);

setTimeout(() => {
    dp.unsubscribe(sub1);
}, 15000);

setInterval(()=>{
    console.log(Date.now(),"fetch");
    dp.fetchRemote();
}, 3000);