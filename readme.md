# James Tupper's VSTS/TFS Build Tasks

Tasks here are built because there isn't already a task in the [Marketplace](http://marketplace.visualstudio.com/) that does it.

## Current tasks

1. **Run Concordion Tests**

    This task will run Concordion tests using NUnit console. Currently, addins do not work with the NUnit test adapters ([see Github issue here](https://github.com/nunit/nunit3-vs-adapter/issues/222)).

    [Docs found here](https://github.com/jamestupper/tppr-vsts-tasks/blob/master/src/Tasks/RunConcordion/icon.png)

## Building & Testing the tasks

If you want to build these tests locally, run the following commands from the root of the repo:

1. Run `cd ./src`

2. Run `npm install`

3. Run `node make.js build`

4. Run `node make.js test` to run tests

## Publishing tasks using `tfx-cli`

If you want to publish any of these build tasks directly to your VSTS/TFS instance, use these commands from the root of the repo:

1. Run through the building & testing steps

2. Run `npm install -g tfx-cli`

3. Run `tfx login` to login to your server

4. Run `tfx build tasks upload --task-path ./_build/Tasks/<task name>` to upload your task

> NOTE: Tasks need to incrementally increase every time they're uploaded. Run `node make.js bump` to increment the task version.

## Locally create the extension package (.vsix)

This will ensure that any changes made can still make a valid .vsix package.

1. Run through the building & testing steps. Ensure `tfx-cli` is installed.

2. Run `node make.js package`