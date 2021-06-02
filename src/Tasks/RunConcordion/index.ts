/// <reference path="../../definitions/node.d.ts" />
/// <reference path="../../definitions/Q.d.ts"/>

import tl = require('vsts-task-lib/task');
import trm = require('vsts-task-lib/toolrunner');
import node = require('q');

async function run() {
    try {
        // error if not on windows
        if (process.platform != 'win32') {
            throw `Platform ${process.platform} not supported.`;
        };

        // set up nunit path
        let nunitRunnerLoc: string = tl.getInput('nunitTestRunnerLocationMethod', true);
        let nunitDirPath: string;
        if (nunitRunnerLoc === 'version') {
            let nunitVersion: string = tl.getInput('nunitTestRunnerVersion', true);
            nunitDirPath = tl.resolve(__dirname,`NUnit-${nunitVersion}/bin`);
        }
        else {
            nunitDirPath = tl.getInput('nunitTestRunnerPath', true);
        }
        console.log(`Using ${nunitDirPath} as path to NUnit`);

        // check if nunit.exe exists in nunit folder
        let nunitExePath: string = tl.resolve(nunitDirPath, 'nunit-console.exe');
        tl.checkPath(nunitExePath, 'nunitExePath');
        

        // create nunit/addins folder if doesn't exist
        let nunitAddinsDirPath:string = tl.resolve(nunitDirPath, 'addins');
        tl.mkdirP(nunitAddinsDirPath);

        // set up concordion path
        let concordionLoc: string = tl.getInput('concordionLocationMethod', true);
        let concordionPath: string;
        if (concordionLoc === 'version') {
            let concordionVersion: string = tl.getInput('concordionVersion', true);
            concordionPath = tl.resolve(__dirname, `Concordion.NET-${concordionVersion}`);
        }
        else {
            concordionPath = tl.getInput('concordionPath', true);
        }
        console.log(`Using ${concordionPath} as path to Concordion`);

        // copy Concordion.NUnit.dll to nunit addins folder
        let concordionNunitFindResults: string[] = tl.findMatch(concordionPath, "**/Concordion.NUnit.dll");
        let concordionNunitDll: string;
        if (concordionNunitFindResults.length > 0) {
            concordionNunitDll = concordionNunitFindResults[0];
        }
        else {
            throw `Unable to find Concordion.NUnit.dll in Concordion path ${concordionPath}`;
        }
        tl.cp(concordionNunitDll, nunitAddinsDirPath, '-f');

        // find test DLLs
        let testsBasePath: string = tl.getInput("sourcesDirectory", true);
        let testAssemblyPattern: string = tl.getInput("testAssembly", true);
        let testFiles: string[] = tl.findMatch(testsBasePath, testAssemblyPattern);
        console.log(`Files found with pattern ${testAssemblyPattern} (count: ${testFiles.length}):\n\t${testFiles.join("\n\t")}`);

        // fail if no tests found
        if (testFiles.length === 0) {
            throw `No test files founds with pattern ${testAssemblyPattern}`;
        }

        // set test results folder and results file
        let workingDirectory: string = tl.getVariable('System.DefaultWorkingDirectory');
        let testResultsDirectory: string = tl.resolve(workingDirectory, 'TestResults');
        tl.mkdirP(testResultsDirectory);
        let buildId: string = tl.getVariable('Build.BuildId');
        let testResultsFile: string = tl.resolve(testResultsDirectory, `ConcordionTestResults-${buildId}.xml`);
        let nunitArgs: string = tl.getInput("nunitArguments");

        // execute concordion tests
        let nunit: trm.ToolRunner = tl
            .tool(nunitExePath)
            .arg(`/basepath=${testsBasePath}`)
            .arg(`/result=${testResultsFile}`)
            .arg(nunitArgs)
            .arg(testFiles);

        // run nunit test console runner
        let rc: number;
        let failureMessage: string;
        try {
            rc = await nunit.exec();
        }
        catch (err) {
            tl.warning(err.message);
            failureMessage = err.message;
        }

        // publish test results
        let tp: tl.TestPublisher = new tl.TestPublisher('NUnit');
        let buildConfig: string = tl.getInput('buildConfiguration', true);
        let buildPlatform: string = tl.getInput('buildPlatform', true);
        let date: Date = new Date();
        let dateString: string = `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}T${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
        tp.publish(testResultsFile, 'false', buildPlatform, buildConfig, "Concordion Tests", dateString);

        // fail if nunit-console returned non-zero code
        if (rc !== 0) {
            tl.setResult(tl.TaskResult.Failed, failureMessage);
        }
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();