'use strict';

let pageBreakPoint = require('./pageBreakpoint');

/**
 * deal a couple of jobs
 */
module.exports = (memory, storeKey, jobName, jobs = [], handle) => {
    if (typeof handle !== 'function') {
        throw new TypeError('handle must be a promise function');
    }
    let {
        continueAtBreakPoint, setBreakPoint
    } = pageBreakPoint(memory, storeKey);

    return new Promise((resolve, reject) => {
        continueAtBreakPoint((breakInfo) => {
            breakInfo = breakInfo || {};

            let curBreakInfo = getCurBreakInfo(breakInfo, jobName);
            // just jump to this page, upgrade the continue times
            upgradeContinueTimes(curBreakInfo);
            // save
            setBreakPoint(breakInfo);

            let handleJob = (flag) => {
                // finished all job already
                if (curBreakInfo.jobIndex >= jobs.length) {
                    resolve(curBreakInfo);
                } else {
                    let job = jobs[curBreakInfo.jobIndex];
                    Promise.resolve(handle(job, curBreakInfo, flag)).then(() => {
                        // finished a job
                        curBreakInfo.jobIndex++;
                        //save the breakpoint
                        setBreakPoint(breakInfo);
                        // next job
                        handleJob(false);
                    }).catch(reject);
                }
            };

            handleJob(true);
        });
    });
};

let getCurBreakInfo = (breakInfo, jobName) => {
    let curBreakInfo = breakInfo[jobName] = breakInfo[jobName] || {
        jobIndex: 0
    };
    return curBreakInfo;
};

let upgradeContinueTimes = (curBreakInfo) => {
    if (curBreakInfo.continueTimes === undefined) {
        curBreakInfo.continueTimes = 0;
    } else {
        curBreakInfo.continueTimes++;
    }
};
