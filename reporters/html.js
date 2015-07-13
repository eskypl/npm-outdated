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

var split = function (string) {
    if (typeof string === 'string') {
        return string.split(',').map(function (value) {
            return value.trim();
        })
    } else {
        return [];
    }
};

var generateReport = function (data, outputPath, templateName) {
    return file.read(__dirname + '/' + (templateName || 'default') + '.html')
        .then(_.template)
        .then(function (template) {
            return template(data);
        })
        .then(function (data) {
            if (outputPath) {
                var filePath = path.resolve(process.cwd(), outputPath);
                file.write(filePath, data);
                console.log('File written: "' + filePath + '"');
            } else {
                console.log(data);
            }

            return;
        })
        .catch(function (e) {
            console.error('HTML reporter error:', e.stack);
        });
};

module.exports = function (data, options) {

    if (options.output === 'true') {
        options.output = '';
    }

    if (options.template === 'true') {
        options.template = '';
    }

    var output = split(options.output);
    var template = split(options.template);
    var tasks = [];
    var count = Math.max(output.length, template.length);

    if (count > 0) {
        while (count--) {
            tasks.push(generateReport(data, output[count], template[count]));
        }
        return Q.all(tasks);
    } else {
        return generateReport(data);
    }

};
