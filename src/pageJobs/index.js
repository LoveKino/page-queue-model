'use strict';

// continue job at the break point
// refresh page will cause the break
let continueAtBreakPoint = (store, handle) => {
    // get break point
    /**
     *
     * breakInfo = {
     *      jobIndex,
     *      continuesTimes
     * }
     */
    return store.get().then((breakInfo) => {
        let getCurBreakInfo = () => {
            let curBreakInfo = breakInfo = breakInfo || {
                jobIndex: -1,
                continueTimes: 0 // refresh times
            };
            return curBreakInfo;
        };

        let upgradeContinueTimes = () => {
            let curBreakInfo = getCurBreakInfo();
            curBreakInfo.continueTimes++;
        };

        let savePoint = () => {
            return store.set(breakInfo);
        };

        // just jump to this page, upgrade the continue times
        upgradeContinueTimes();
        // savePoint
        savePoint();

        handle({
            savePoint,
            getCurBreakInfo
        });
    });
};

/**
 * deal a couple of jobs
 *
 * if rehresh happend, continue the job from break point
 */
module.exports = (jobs = [], store, handle) => {
    if (typeof handle !== 'function') {
        throw new TypeError('handle must be a promise function');
    }

    return new Promise((resolve, reject) => {
        continueAtBreakPoint(store, ({
            savePoint,
            getCurBreakInfo
        }) => {
            let curBreakInfo = getCurBreakInfo();

            let handleJob = (flag) => {
                // finished all job already
                if (curBreakInfo.jobIndex >= jobs.length - 1) {
                    resolve(curBreakInfo);
                } else {
                    let job = jobs[curBreakInfo.jobIndex + 1];

                    Promise.resolve(handle(job, {
                        jobIndex: curBreakInfo.jobIndex,
                        continueTimes: curBreakInfo.continueTimes,
                        jobs,
                        flag
                    })).then(() => {
                        // finished a job
                        curBreakInfo.jobIndex++;
                        //savePoint the breakpoint
                        savePoint();
                        // next job
                        handleJob(false);
                    }).catch(reject);
                }
            };

            // first job: passing true
            handleJob(true);
        });
    });
};
