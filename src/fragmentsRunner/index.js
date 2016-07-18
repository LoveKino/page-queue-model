'use strict';

let pageJobs = require('../pageJobs');

/**
 * 1. devide jobs into fragments and a fragment contain some actions
 *
 * 2. page may refresh at any time
 *
 *
 * deal them one by one.
 */

module.exports = (memory, key, fragments) => {
    let runFragment = (fragment, actionHandler) => {
        // deal actions
        return pageJobs(memory, key, 'action', fragment, actionHandler);
    };

    let start = (dispatch) => pageJobs(memory, key, 'fragment', fragments, dispatch);

    return {
        runFragment,
        start
    };
};
