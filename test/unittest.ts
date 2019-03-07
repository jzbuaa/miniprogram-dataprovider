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


setTimeout(() => {
    dp.unsubscribe(sub2);
}, 10000);

setTimeout(() => {
    dp.unsubscribe(sub1);
}, 15000);