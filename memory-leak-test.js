// node --expose-gc memory-leak-test.js

const fs = require("fs");
const resemble = require("./resemble");

let max = 2000;
const timerLabel = "2000 compare";
console.time(timerLabel);

compare();

function compare() {
    const people = fs.readFileSync("./demoassets/ghost1.png");
    const people2 = fs.readFileSync("./demoassets/ghost2.png");

    resemble(people)
        .compareTo(people2)
        .onComplete(() => {
            if (--max >= 0) {
                process.nextTick(compare);
            } else {
                process.nextTick(log);
            }
            global.gc();
            if (max % 100 === 0) {
                const mem = process.memoryUsage();
                console.log(max, mem.rss, mem.heapUsed, mem.external);
            }
        });
}

function log() {
    console.timeEnd(timerLabel);
    process.exit(0); //eslint-disable-line
}
