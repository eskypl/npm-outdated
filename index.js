'use strict';

var Q = require('q');
var argv = require('argv');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var pkg = require('./lib/pkg');

var args = argv.option({
    name: 'base',
    short: 'b',
    type: 'string',
    description: 'Base directory. Defaults to cwd.',
    example: ""
}).run();

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

function readOptional(file) {
    return Q.promise(function(resolve, reject){
        fs.readFile(path.resolve(cwd, file), {
            encoding: 'utf8'
        }, function (error, data) {
            finalize(resolve, reject)(null, data || {});
        });
    });
}

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

function buildDependenciesTree(packageJSON, npmShrinkwrap, outdated, installed) {

    var list = {
        dependencies: {},
        devDependencies: {},
        summary: {
            total: new Summary(),
            development: new Summary(),
            runtime: new Summary()
        }
    };

    for (var type in list) {
        if (packageJSON[type]) {
            for (var name in packageJSON[type]) {

                var locked = (npmShrinkwrap.dependencies || {})[name];

                list[type][name] = {
                    required: packageJSON[type][name],
                    locked: ((locked) ? locked.version : null),
                    wanted: outdated[name].wanted,
                    latest: outdated[name].latest
                }

                list[type][name].status = pkg.isUpdateNeeded(list[type][name]);
            }
        }
    }

    //['dependencies', 'devDependencies'].forEach(function (type) {
    //    for (var i in list[type]) {
    //        var pkg = list[type][i];
    //        (list.summary.total[pkg.status] = list.summary.total[pkg.status] || []).push(pkg.name);
    //        (list.summary[type][pkg.status] = list.summary[type][pkg.status] || []).push(pkg.name);
    //    }
    //});

    // TODO generate summary of required and recommended updates

    //console.log(list);
    //console.log(typeof npmShrinkwrap.dependencies)
    //console.log(typeof npmShrinkwrap.devDependencies)

    //console.log(pkg);
    //console.log(outdated);
    //console.log(installed);

    return list;
}

function report(reporter) {
    return function (data) {
        console.log(data);
    }
};

Q.all([
    // TODO read npm-shrinkwrap if exists
    read('package.json'),
    readOptional('npm-shrinkwrap.json'),
    npm('outdated'),
    //npm('ls')
])
.spread(buildDependenciesTree)
.then(report('html'))
.catch(console.error);

