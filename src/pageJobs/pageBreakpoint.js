'use strict';

const local = (typeof window === 'object' && window && window.localStorage) || {};

let defMemory = {
    set: (key, value) => {
        local[key] = value;
    },

    get: (key) => {
        return local[key];
    }
};

module.exports = (memory = defMemory, key) => {
    // continue job at the break point
    // refresh action will cause the break
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
