var pkg = require('../../tasks/lib/pkg');
var fixture =  {
    current: '0.2.2',
    wanted: '0.2.5',
    latest: '0.3.0',
    location: '',
    type: 'dependencies'
}

describe('package', function () {
    describe('#isUpdateNeeded', function () {
        it('should return "none" if there is no available update', function () {
            expect(pkg.isUpdateNeeded({
                current: '0.2.2',
                wanted: '0.2.2',
                latest: '0.2.2'
            })).to.equal('none');
        });
        it('should return "required" if there is a patch for wanted version', function () {
            expect(pkg.isUpdateNeeded({
                current: '0.2.2',
                wanted: '0.2.5',
                latest: '0.3.1'
            })).to.equal('required');
            expect(pkg.isUpdateNeeded({
                current: '0.4.3',
                wanted: '0.4.3',
                latest: '0.4.4'
            })).to.equal('required');
        });
        it('should return "recommended" if there is a new version available', function () {
            expect(pkg.isUpdateNeeded({
                current: '0.2.2',
                wanted: '0.2.2',
                latest: '0.3.1'
            })).to.equal('recommended');
        });
    });
    describe('#hasNewVersions', function () {
        it('should return true if greater latest version is available', function () {

        });
    });
});
