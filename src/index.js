'use strict';

let centerJobWins = require('./centerJobWins');

let fragmentsRunner = require('./fragmentsRunner');

let id = v => v;

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
    handleOpts,
    handleFragmentWrapper
}) => {
    handleFragmentWrapper = handleFragmentWrapper || id;

    return Promise.resolve(centerJobWins({
        winId,
        rootId,
        sandbox,
        call,
        memory,
        storeKey
    })).then((opts) => {
        handleOpts && handleOpts(opts);

        let {
            runFragment, start
        } = fragmentsRunner(opts.memory, indexKey, fragments);

        let handleFragment = (fragment) => {
            return runFragment(fragment, (action, info, refreshFlag) => {
                return runItem(action, info, refreshFlag, fragment);
            });
        };
        // define job for every node
        opts.setJob(handleFragmentWrapper(handleFragment));

        let dispatch = (fragment) => {
            // find which window to play fragments
            return Promise.resolve(
                getWinId(fragment, opts.windows, fragments)
            ).then((winId) => {
                if (!winId) { // root
                    return opts.sendJob(fragment);
                } else {
                    return opts.sendJob(winId, fragment);
                }
            });
        };

        // define job
        // dispatch fragments
        if (opts.type === 'center') {
            return start(dispatch);
        }
    });
};
