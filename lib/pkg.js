var semver = require('semver');

var STATUS_UNKNOWN = 'unknown';
var STATUS_NO_UPDATE = 'none';
var STATUS_UPDATE_REQUIRED = 'required';
var STATUS_UPDATE_RECOMMENDED = 'recommended';

var semverStatusMap = {
    major: STATUS_UPDATE_RECOMMENDED,
    premajor: STATUS_NO_UPDATE,
    minor: STATUS_UPDATE_RECOMMENDED,
    preminor: STATUS_NO_UPDATE,
    patch: STATUS_UPDATE_REQUIRED,
    prepatch: STATUS_NO_UPDATE,
    prerelease: STATUS_NO_UPDATE
}

module.exports = {

    status: {
        UNKNOWN: STATUS_UNKNOWN,
        NO_UPDATE: STATUS_NO_UPDATE,
        UPDATE_REQUIRED: STATUS_UPDATE_REQUIRED,
        UPDATE_RECOMMENDED: STATUS_UPDATE_RECOMMENDED
    },

    /**
     * If current version is patched then mark package as "requiring" an update.
     * If there is no patch for current version then look into latest version and
     * eventually "recommend" and update to higher minor/major version.
     * @param {object} version
     * @returns {string}
     */
    isUpdateNeeded: function(version) {

        if (version.wanted === 'git' || version.latest === 'git') {
            return STATUS_UNKNOWN;
        }

        var diffStatus = semver.diff(version.wanted, version.latest);
        var status = semverStatusMap[diffStatus] || STATUS_UNKNOWN;

        if (diffStatus === null) {
            return STATUS_NO_UPDATE;
        }
        else {
            return status;
        }
    }
};
