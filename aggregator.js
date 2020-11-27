const fs = require('fs');
const path = require('path');

const [
    nodePath, aggregatorPath, profileFileDirectory, weatherFileDirectory,
    profileOutputFile, weatherOutputFile, profileSubsampledOutputFile
] = process.argv;

const columnIndex = 9; // depth

const profileSplitLinesList = processDirectory(profileFileDirectory, profileOutputFile);
processDirectory(weatherFileDirectory, weatherOutputFile);
createSubSample(profileSplitLinesList, profileSubsampledOutputFile);

function processDirectory(directory, outputFileName) {
    const fileNames = fs.readdirSync(directory);
    const splitLinesList = fileNames.map(fileName => readTabDelimitedFile(path.join(directory, fileName)));

    writeMergedFileContent(splitLinesList, outputFileName);

    return splitLinesList;
}

function createSubSample(splitLinesList, outputFileName) {
    const closestToIntegerSplitLines = [];

    for (const splitLines of splitLinesList) {
        for (const group of groupByClosestInteger(splitLines, columnIndex)) {
            group.sort((splitLineA, splitLineB) => {
                return Math.abs(getSplitLineColumnClosestIntegerDiff(splitLineA, columnIndex))
                    - Math.abs(getSplitLineColumnClosestIntegerDiff(splitLineB, columnIndex));
            });

            closestToIntegerSplitLines.push(group[0]);
        }
    }

    const columnNames = splitLinesList[0].slice(0, 1);

    const outputFile = fs.openSync(outputFileName, 'w+');

    fs.writeFileSync(outputFile, splitLinesToFileContent(columnNames), 'utf8');
    fs.writeFileSync(outputFile, splitLinesToFileContent(closestToIntegerSplitLines), 'utf8');
}

function getSplitLineColumnClosestIntegerDiff(splitLine, columnIndex) {
    const value = parseFloat(splitLine[columnIndex]);
    const closestInteger = Math.round(value);

    return value - closestInteger;
}

function groupByClosestInteger(splitLines, columnIndex) {
    const groups = {};
    const groupsOrder = [];

    for (const splitLine of splitLines) {
        const closestInteger = Math.round(parseFloat(splitLine[columnIndex]));

        if (isNaN(closestInteger)) {
            continue;
        }

        if (!groups[closestInteger]) {
            groups[closestInteger] = [];
            groupsOrder.push(closestInteger);
        }

        groups[closestInteger].push(splitLine);
    }

    const groupsList = [];

    for (const closestInteger of groupsOrder) {
        groupsList.push(groups[closestInteger]);
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