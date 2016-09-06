'use strict';

let local = null;

try {
    local = (typeof window === 'object' && window && window.localStorage) || {};
} catch (e) { // eslint-disable-line
}

module.exports = {
    set: (key, value) => {
        return Promise.resolve(local[key] = value);
    },

    get: (key) => {
        return Promise.resolve(local[key]);
    }
};
