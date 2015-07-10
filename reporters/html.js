var path = require('path');

module.exports = function (pkg) {

    var template = this.file.read(__dirname + '/html.html');
    var res = this.template.process(template, {
        data: pkg
    })

    var file = path.resolve(process.cwd(), 'report.html');

    //console.log(res);

    this.file.write(file, res);
    this.log.ok('Write:', file);


};
