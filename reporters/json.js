var Q = require('q');

module.exports = function (pkg) {
    return Q.fcall(console.log, pkg);
};
