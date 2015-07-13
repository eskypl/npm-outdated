var path = require('path');
var fs = require('fs');
var Q = require('q');
var _ = require('lodash');

var file = {
    read: function (filePath) {
        return Q.nfcall(fs.readFile, filePath, "utf-8");
    },
    write: function (filePath, data) {
        return Q.nfcall(fs.writeFile, filePath, data, "utf-8");
    }
};

module.exports = function (pkg, outputFile) {
    return file.read(__dirname + '/html.html')
        .then(_.template)
        .then(function (template) {
            return template(pkg);
        })
        .then(function (data) {
            if (outputFile) {
                var filepath = path.resolve(process.cwd(), outputFile);
                file.write(filepath, data);
                console.log('File written: "' + filepath + '"');
            } else {
                console.log(data);
            }

            return;
        })
        .catch(function (e) {
            console.error('HTML reporter error:', e.stack);
        });
};
