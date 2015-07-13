#!/usr/bin/env node

'use strict';

var Q = require('q');
var argv = require('argv');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var pkg = require('../lib/pkg');

argv.info('npm dependency checker and reporter.');
argv.option({
    name: 'base',
    short: 'b',
    type: 'string',
    description: 'Base directory. Defaults to cwd.'
});

argv.option({
    name: 'output',
    short: 'o',
    type: 'string',
    description: 'Output file for supported reporters, like "html".'
});

argv.option({
    name: 'reporter',
    short: 'r',
    type: 'string',
    description: 'Name of the reporter. Available reporters: "json", "html".'
});

var args = argv.run();
var cwd = (args.options.base)
    ? path.resolve(args.options.base)
    : process.cwd();

function Summary() {
    for (var name in pkg.status) {
        this[pkg.status[name]] = []
    }
}

function finalize(resolve, reject) {
    return function (error, data) {
        if (error !== null) {
            reject(error);
        }
        else if (data === '') {
            resolve({});
        }
        else {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        }
    }
}

function read(file) {
    return Q.promise(function(resolve, reject){
        fs.readFile(path.resolve(cwd, file), {
            encoding: 'utf8'
        }, finalize(resolve, reject));
    });
}

read.optional = function (file) {
    return Q.promise(function(resolve, reject){
        fs.readFile(path.resolve(cwd, file), {
            encoding: 'utf8'
        }, function (error, data) {
            finalize(resolve, reject)(null, data || '{}');
        });
    });
};

function npm(command) {
    return Q.Promise(function(resolve, reject) {
        var cmd = [
            'npm',
            command,
            '--registry=https://registry.npmjs.org/',
            '--cache-min=0',
            '--depth=0',
            '--long',
            '--json'
        ].join(' ');

        exec(cmd, {
            cwd: cwd
        }, finalize(resolve, reject));
    });
}

function buildDependenciesTree(packageJSON, npmShrinkwrap, outdatedList) {

    var list = {
        name: packageJSON.name,
        version: packageJSON.version,
        dependencies: {},
        devDependencies: {},
        summary: {
            total: new Summary(),
            dependencies: new Summary(),
            devDependencies: new Summary()
        }
    };

    ['dependencies', 'devDependencies'].forEach(function (type) {
        if (packageJSON[type]) {
            for (var name in packageJSON[type]) {

                var locked = (npmShrinkwrap.dependencies || {})[name];
                var outdated = outdatedList[name] || {};

                list[type][name] = {
                    name: name,
                    required: packageJSON[type][name],
                    locked: ((locked) ? locked.version : null),
                    wanted: outdated.wanted || null,
                    latest: outdated.latest || null,
                    status: null
                };

                if (outdated.wanted === 'git' || outdated.latest === 'git') {
                    list[type][name].required = null;
                }

                list[type][name].status = pkg.isUpdateNeeded(list[type][name]);
            }
        }
    });

    return list;
}

function buildSummary(list) {
    ['dependencies', 'devDependencies'].forEach(function (type) {
        for (var i in list[type]) {
            var pkg = list[type][i];
            (list.summary.total[pkg.status] = list.summary.total[pkg.status] || []).push(pkg.name);
            (list.summary[type][pkg.status] = list.summary[type][pkg.status] || []).push(pkg.name);
        }
    });

    return list;
}

function prepareReporter(data) {
    return [data, args.options.output];
}

function report(name) {
    var reporterName = name;
    var reporter;

    if (!reporterName) {
        reporterName = 'json';
    }
    try {
        return require('../reporters/' + reporterName);
    } catch (e) {
        throw new Error('Cannot find reporter: ' + reporterName);
    }

}

Q.all([
    read('package.json'),
    read.optional('npm-shrinkwrap.json'),
    npm('outdated')
])
.spread(buildDependenciesTree)
.then(buildSummary)
.then(prepareReporter)
.spread(report(args.options.reporter))
.catch(function (error) {
    console.error(error.stack);
});
