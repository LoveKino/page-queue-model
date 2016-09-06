'use strict';

let initWindowWorker = require('./initWindowWorker');

let pageJobs = require('./pageJobs');

let defMemory = require('./defMemory');

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
    indexKey,
    storeKey,
    sandbox,
    call,
    runItem,
    getWinId,

    handleFragmentWrapper = id, memory = defMemory
}) => {
    let workerStore = getStore(memory, storeKey);
    let pageJobStore = getStore(memory, indexKey);

    let handleFragment = handleFragmentWrapper(({
        fragment, fragmentInfo
    }) => {
        return pageJobs('action', fragment, pageJobStore, (action, actionInfo) => {
            return runItem(action, actionInfo, fragmentInfo);
        });
    });

    // init window as a worker
    // center send job to nodes
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
            return pageJobs('fragment', fragments, pageJobStore, (fragment, fragmentInfo) => {
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
