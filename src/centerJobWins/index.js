'use strict';

/**
 * use root window as the center point
 */

module.exports = ({
    winId,
    rootId,
    storeKey,
    sandbox,
    call,
    memory
}) => {
    storeKey = storeKey || `${rootId}-node-model-info`;

    let setJob = (doJob) => sandbox.doJob = doJob;

    let ret = {
        sandbox,
        call,
        memory,
        setJob
    };

    if (winId === rootId) {
        // current window is center point
        return memory.get(storeKey).then((data) => {
            data = data || {
                windows: []
            };

            sandbox.connect = connector(memory, data, storeKey);

            ret.sendJob = sendJober(call, sandbox, data);
            ret.type = 'center';
            ret.windows = data.windows;

            return ret;
        });
    } else {
        // current window is a none-center point
        // send window info to center
        call('callOtherWindow', [rootId, 'connect', [winId]]);

        ret.type = 'edge';

        return ret;
    }
};

let connector = (memory, data, storeKey) => (winId) => {
    if (!contain(data.windows, winId)) {
        data.windows.push(winId);
        // save result
        return memory.set(storeKey, data);
    }
};

let sendJober = (call, sandbox, data) => (...args) => {
    if (args.length <= 1) {
        // call center to do a job
        return Promise.resolve(sandbox.doJob(args[0]));
    } else {
        if (!contain(data.windows, args[0])) {
            throw new Error('missing window');
        }
        return call('callOtherWindow', [args[0],
            'doJob', [args[1]]
        ]);
    }
};

let contain = (list, item) => {
    for (let i = 0; i < list.length; i++) {
        if (item === list[i]) {
            return true;
        }
    }
    return false;
};
