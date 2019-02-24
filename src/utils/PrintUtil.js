let startTime
let beginningLength

const printInfo = endingLength => {
    const sizeReduction = (((beginningLength - endingLength) / beginningLength) * 100).toFixed(1)
    console.log(`PurifyCSS has reduced the file size by ~ ${sizeReduction}%`)
}

const printRejected = rejectedTwigs => {
    console.log(`PurifyCSS - Rejected selectors:\n    ${rejectedTwigs.join("\n    |\t")}`)
}

const startLog = cssLength => {
    startTime = new Date()
    beginningLength = cssLength
}

export default {
    printInfo,
    printRejected,
    startLog
}
