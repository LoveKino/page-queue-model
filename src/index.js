'use strict';

let initWindowWorker = require('./initWindowWorker');

let pageJobs = require('./pageJobs');

let defMemory = require('./defMemory');

let {
    reduce
} = require('bolzano');

let id = v => v;

let getStore = (memory, key) => {
    return {
        get: () => {
            return Promise.resolve(memory.get(key));
        },

        set: (data) => {
            return Promise.resolve(memory.set(key, data));
        }
    };
};

// consume queue fragments
module.exports = (fragments, {
    winId,
    rootId,
    prefix,
    sandbox,
    call,
    memory = defMemory
}) => {
    let workerStore = getStore(memory, prefix + '-store');
    let fragmentJobStore = getStore(memory, prefix + '-fragment');
    let itemJobStore = getStore(memory, prefix + '-item');

    let getJobOrder = () => Promise.all([fragmentJobStore.get(), itemJobStore.get()]).then(([frgInfo, itemInfo]) => {
        if (!fragments.length) return -1;
        let frgIndex = frgInfo ? frgInfo.jobIndex : -1;
        let itemIndex = itemInfo ? itemInfo.jobIndex : -1;
        let subs = fragments.slice(0, frgIndex + 1);
        let prevSum = reduce(subs, (prev, cur) => prev + cur.length, 0);
        // special case: just finished all
        if (frgIndex === fragments.length - 1 && itemIndex === fragments[fragments.length - 1].length - 1) {
            return prevSum;
        }
        return prevSum + itemIndex;
    });

    // init window as a worker
    // center send job to nodes
    let start = (runItem, getWinId, handleFragmentWrapper = id) => {
        let handleFragment = handleFragmentWrapper(({
            fragment, fragmentInfo
        }) => {
            return pageJobs(fragment, itemJobStore, (action, actionInfo) => {
                return runItem(action, actionInfo, fragmentInfo);
            });
        });

        return initWindowWorker(handleFragment, {
            winId,
            rootId,
            sandbox,
            call,
            workerStore
        }).then(({
            type,
            sendJob,
            windows
        }) => {
            if (type === 'center') {
                // run fragments as jobs
                return pageJobs(fragments, fragmentJobStore, (fragment, fragmentInfo) => {
                    // find which window to play fragments
                    return Promise.resolve(
                        getWinId(fragment, windows, fragments)
                    ).then((winId) => {
                        let args = [{
                            fragment, fragmentInfo
                        }];
                        winId && args.unshift(winId);
                        return sendJob.apply(undefined, args);
                    });
                });
            }
        });
    };

    return {
        start,
        getJobOrder
    };
};
