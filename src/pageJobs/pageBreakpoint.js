'use strict';

module.exports = (memory, key) => {
    // continue job at the break point
    // refresh page will cause the break
    let continueAtBreakPoint = (handle) => {
        // get break point
        return memory.get(key).then(handle);
    };

    /**
     * set breakpoint info. After refreshing, load this breakpoint to continue your job
     */
    let setBreakPoint = (breakInfo) => {
        return memory.set(key, breakInfo);
    };

    return {
        continueAtBreakPoint,
        setBreakPoint
    };
};
