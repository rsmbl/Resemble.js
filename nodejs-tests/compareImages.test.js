/* eslint-env jest*/

const compareImages = require("../compareImages");
const fs = require("fs");
const util = require("util");
const readFile = util.promisify(fs.readFile);

describe("compareImages", () => {
    test("Buffers data", async () => {
        const readImg1 = readFile("./demoassets/People.jpg");
        const readImg2 = readFile("./demoassets/People2.jpg");
        const readComparison = readFile("./nodejs-tests/assets/PeopleComparedToPeople2.png");

        const data = await compareImages(await readImg1, await readImg2);
        const buffer = data.getBuffer();
        const comparison = await readComparison;

        expect(data.isSameDimensions).toBe(true);
        expect(data.misMatchPercentage).toEqual("8.66");
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBe(91876);
        expect(buffer.equals(comparison)).toBe(true);
    });

    test("Buffer data includeOriginal", async () => {
        const readImg1 = readFile("./demoassets/People.jpg");
        const readImg2 = readFile("./demoassets/People2.jpg");
        const readComparison = readFile("./nodejs-tests/assets/PeopleComparedToPeople2WithOriginal.png");
        const data = await compareImages(await readImg1, await readImg2);
        const buffer = data.getBuffer(true);
        const comparison = await readComparison;
        expect(buffer.equals(comparison)).toBe(true);
    });

    test("throws when failed", async () => {
        const promise = compareImages(fs.readFileSync("./demoassets/People.jpg"), "bogus data");
        await expect(promise).rejects.toMatch("Error: ENOENT, No such file or directory 'bogus data'");
    });

    test("returns early", async () => {
        const readImg1 = readFile("./demoassets/People.jpg");
        const readImg2 = readFile("./demoassets/People2.jpg");
        const options = {
            returnEarlyThreshold: 5
        };
        const data = await compareImages(await readImg1, await readImg2, options);

        expect(data.misMatchPercentage).toEqual("5.00");
    });
});
