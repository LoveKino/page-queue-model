'use strict';

let initWindowWorker = require('./initWindowWorker');

let fragmentsRunner = require('./fragmentsRunner');

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
    memory,
    runItem,
    getWinId,
    handleFragmentWrapper = id
}) => {
    let {
        runFragment, start
    } = fragmentsRunner(memory, indexKey, fragments);

    let handleFragment = (fragment) => {
        return runFragment(fragment, (action, info, refreshFlag) => {
            return runItem(action, info, refreshFlag, fragment);
        });
    };
    handleFragment = handleFragmentWrapper(handleFragment);

    // init window as a worker
    // center send job to nodes
    return Promise.resolve(initWindowWorker(handleFragment, {
        winId,
        rootId,
        sandbox,
        call,
        workerStore: getStore(memory, storeKey)
    })).then(({
        type,
        sendJob,
        windows
    }) => {
        let dispatch = (fragment) => {
            // find which window to play fragments
            return Promise.resolve(
                getWinId(fragment, windows, fragments)
            ).then((winId) => {
                if (!winId) { // root
                    return sendJob(fragment);
                } else {
                    return sendJob(winId, fragment);
                }
            });
        };

        // define job
        // dispatch fragments
        if (type === 'center') {
            return start(dispatch);
        }
    });
};
