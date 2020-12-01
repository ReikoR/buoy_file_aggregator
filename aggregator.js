const fs = require('fs');
const path = require('path');

const [
    nodePath, aggregatorPath, profileFileDirectory, weatherFileDirectory,
    profileOutputFile, weatherOutputFile, profileSubsamplingSteps
] = process.argv;

const columnIndex = 9; // depth

const subsamplingStepsStrings = profileSubsamplingSteps.split(',');

console.log('subsamplingSteps', subsamplingStepsStrings.map(v => parseFloat(v)));

const profileSplitLinesList = processDirectory(profileFileDirectory, profileOutputFile);
processDirectory(weatherFileDirectory, weatherOutputFile);
createSubSamples(profileSplitLinesList, profileOutputFile, subsamplingStepsStrings);

function processDirectory(directory, outputFileName) {
    const fileNames = fs.readdirSync(directory);
    const splitLinesList = fileNames.map(fileName => readTabDelimitedFile(path.join(directory, fileName)));

    writeMergedFileContent(splitLinesList, outputFileName);

    return splitLinesList;
}

function createSubSamples(splitLInesList, outputFileName, subsamplingStepsStrings) {
    const extensionName = path.extname(outputFileName);
    const basename = path.basename(outputFileName, extensionName);

    for (const stepString of subsamplingStepsStrings) {
        const step = parseFloat(stepString);
        createSubSample(splitLInesList, `${basename}_subsampled_${stepString}_${extensionName}`, step)
    }
}

function createSubSample(splitLinesList, outputFileName, subsamplingStep) {
    const closestToIntegerSplitLines = [];

    for (const splitLines of splitLinesList) {
        for (const group of groupByStep(splitLines, columnIndex, subsamplingStep)) {
            group.sort((splitLineA, splitLineB) => {
                return Math.abs(getSplitLineColumnClosestStepDiff(splitLineA, columnIndex, subsamplingStep))
                    - Math.abs(getSplitLineColumnClosestStepDiff(splitLineB, columnIndex, subsamplingStep));
            });

            closestToIntegerSplitLines.push(group[0]);
        }
    }

    const columnNames = splitLinesList[0].slice(0, 1);

    const outputFile = fs.openSync(outputFileName, 'w+');

    fs.writeFileSync(outputFile, splitLinesToFileContent(columnNames), 'utf8');
    fs.writeFileSync(outputFile, splitLinesToFileContent(closestToIntegerSplitLines), 'utf8');
}

function getSplitLineColumnClosestStepDiff(splitLine, columnIndex, step) {
    const value = parseFloat(splitLine[columnIndex]);
    const closestInteger = Math.round(value / step) * step;

    return value - closestInteger;
}

function groupByStep(splitLines, columnIndex, step) {
    const groups = {};
    const groupsOrder = [];

    for (const splitLine of splitLines) {
        const closestStep = Math.round(parseFloat(splitLine[columnIndex]) / step) * step;

        if (isNaN(closestStep)) {
            continue;
        }

        if (!groups[closestStep]) {
            groups[closestStep] = [];
            groupsOrder.push(closestStep);
        }

        groups[closestStep].push(splitLine);
    }

    const groupsList = [];

    for (const closestStep of groupsOrder) {
        groupsList.push(groups[closestStep]);
    }

    return groupsList;
}

function writeMergedFileContent(splitLinesList, outputFileName) {
    const outputFile = fs.openSync(outputFileName, 'w+');

    fs.writeFileSync(outputFile, splitLinesToFileContent(splitLinesList[0]), 'utf8');

    for (const splitLines of splitLinesList.slice(1)) {
        fs.writeFileSync(outputFile, splitLinesToFileContent(splitLines.slice(1)), 'utf8');
    }
}

function readTabDelimitedFile(fileName) {
    const content = fs.readFileSync(fileName, 'utf8');

    const lines = content.split('\n');

    return lines.map(line => line.split('\t'))
}

function splitLinesToFileContent(splitLines) {
    return splitLines.map(splitLine => splitLine.join('\t')).join('\n') + '\n';
}