"use strict";

var fs = require('fs-extra'),
    path = require('path'),
    proxyquire = require('proxyquire');

var base = __dirname + "/../";


describe("Testing 'rekuire'",function(){

    beforeEach(function(){
        var setupDone = false;
        runs( function () {
            copyRekToNodeModules(function(){
                setupDone = true;
            });
        });
        waitsFor(function () { return !!setupDone; } , 'Timed out', 100);
    });

    afterEach(function(){
        clearNodeModules();
    });


    describe("when running",function(){
        it("should retrieve it according to the file name",function(){
            var rek = require('rekuire');
            var imported = rek('someModule.js');
            expect(imported).toBe("some module");
        });

        it("should distinct among file type", function(){
            var rek = require('rekuire');
            var error;
            var sameNameJs = rek('sameName.js');
            var sameNameJson = rek('sameName.json');
            var sameNameCoffee = rek('sameName.coffee');
            try{
                rek('sameName'); // should return ambiguity error
            }catch(e){
                error = e;
            }

            expect(sameNameJs ).toEqual("sameName.js");
            expect(sameNameCoffee ).toEqual("sameName.coffee");
            expect(sameNameJson ).toEqual({"name":"same"});
            expect(error ).not.toBeNull();
        });

        it("should retrieve it according to the file name (*.json)",function(){
            var rek = require('rekuire');
            var imported = rek('someJsonObject.json');
            expect(imported).toEqual({"someKey":"someValue"});
        });

        it("should retrieve it according to the file name (*.coffee)",function(){
            var rek = require('rekuire');
            var withExt = rek('cup.coffee');
            var withoutExt = rek('cup');
            expect(withExt ).toEqual("cup of coffee")
            expect(withExt ).toEqual(withoutExt );
        });

        it("should get module by name even if extension not present",function(){
            var rek = require('rekuire');
            var jsModule = rek('someModule');
            var jsonObject = rek('someJsonObject');

            expect(jsModule).toBe("some module");
            expect(jsonObject).toEqual({"someKey":"someValue"});
        });

        it("should retrieve it according to relative path",function(){
            var rek = require('rekuire');
            var imported = rek('./testResources/nestedPackage/someModule.js');
            expect(imported).toBe("some module");
        });

        it("should retrieve module from node_modules",function(){
            var rek = require('rekuire');
            var fse = rek('fs-extra');
            expect(fse).not.toBeNull();
        });

        it("should retrieved node framework modules",function(){
            var rek = require('rekuire');
            var fse = rek('fs');
            expect(fse).not.toBeNull();
        });

        it("should throw an error if not found", function(){
            var rek = require('rekuire');
            var error = null;
            try{
                rek('no-such-package');
            }catch(e){
                error = e;
            }
            expect(error).not.toBeNull();
        })
    });

    describe("when rekuiring a name that matches two files in the system",function(){
        it("should throw an error", function(){
            var rek = require('rekuire');
            var error = null;
            try{
                rek('SameNamedModule');
            }catch(e){
                error = e;
            }
            expect(error).not.toBeNull();
        })
    });
    describe("when rekuiring just the local path", function(){
        it("should return the right path", function(){
            var rek = require('rekuire');
            var localPath = path.relative(__dirname,rek().path('someModule.js'));
            expect(localPath).toEqual(path.normalize("testResources/nestedPackage/someModule.js"));
        });

        it("should return the right path without the use of parentheses", function(){
            var rek = require('rekuire');
            var rekPath = rek.path('someModule.js');
            var localPath = path.relative(__dirname,rekPath);
            expect(localPath).toEqual(path.normalize("testResources/nestedPackage/someModule.js"));
        });
        
        it("should return just the module name if its a global module",function(){
            var rek = require('rekuire');
            var rekPath = rek.path('fs-extra');
            expect(rekPath).toEqual("fs-extra");
        });

        it("should throw an error if couldn't find", function(){
            var rek = require('rekuire');
            var error = null;
            try{
                rek().path('no-such-package');
            }catch(e){
                error = e;
            }
            expect(error).not.toBeNull();
        });

    });

    describe("when used with proxyrequire", function(){
        it("should be able rekuires to be replaced", function(){
            var rek = require('rekuire');
            var fakeFs = {this_module:"is fake"};
            var ModuleToBeProxied = proxyquire(rek().path('ModuleToBeProxied'),{fs:fakeFs});
            var instance = new ModuleToBeProxied();
            expect(instance.getFs()).toBe(fakeFs);
        });
    });
});




// SETUP & TEARDOWN

function copyRekToNodeModules(callback){
    fs.mkdirsSync( base + "/node_modules/rekuire/lib");
    fs.copy(base+"lib/", base + "/node_modules/rekuire/lib", function(){
        fs.copy(base+"package.json", base + "node_modules/rekuire/package.json", callback);
    });
}

function clearNodeModules(){
    fs.removeSync( base + "node_modules/rekuire");
}
