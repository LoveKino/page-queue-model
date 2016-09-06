'use strict';

let {
    contain
} = require('bolzano');

/**
 * use root window as the center point
 *
 * if current window is root window, initial it.
 *
 * if current window is not root window, connect to root window
 */

module.exports = (job, {
    winId,
    rootId,
    sandbox,
    call,
    workerStore
}) => {
    sandbox.doJob = job;

    let connector = (data) => (winId) => {
        if (!contain(data.windows, winId)) {
            data.windows.push(winId);
            // save result
            return workerStore.set(data);
        }
    };

    if (winId === rootId) {
        // current window is center point
        return workerStore.get().then((data) => {
            data = data || {
                windows: []
            };

            sandbox.connect = connector(data);

            return {
                sendJob: sendJober(call, sandbox, data),
                type: 'center',
                windows: data.windows
            };
        });
    } else {
        // current window is a none-center point
        // send window info to center
        call('callOtherWindow', [rootId, 'connect', [winId]]);

        return {
            type: 'edge'
        };
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
