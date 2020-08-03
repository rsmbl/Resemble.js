/* eslint-env jest*/

const resemble = require("../resemble");
const fs = require("fs");

const testErrorPixelTransform = (transform) => {
    const people = fs.readFileSync("./demoassets/ghost1.png");
    const people2 = fs.readFileSync("./demoassets/ghost2.png");

    return new Promise((resolve) => {
        resemble.outputSettings({
            errorType: transform,
            errorColor: {
                red: 255,
                green: 255,
                blue: 0
            }
        });

        resemble(people)
            .compareTo(people2)
            .onComplete((data) => {
                const buffer = data.getBuffer();

                expect(buffer).toBeInstanceOf(Buffer);

                // fs.writeFileSync(`./nodejs-tests/assets/pixelErrorTransform/${transform}.new.png`, buffer);

                const comparison = fs.readFileSync(`./nodejs-tests/assets/pixelErrorTransform/${transform}.png`);

                expect(buffer.equals(comparison)).toBe(true);
                resolve();
            });
    });
};

describe("errorPixelTransform", () => {
    test("flat", async () => testErrorPixelTransform("flat"));

    test("movement", async () => testErrorPixelTransform("movement"));

    test("flatDifferenceIntensity", async () => testErrorPixelTransform("flatDifferenceIntensity"));

    test("movementDifferenceIntensity", async () => testErrorPixelTransform("movementDifferenceIntensity"));

    test("diffOnly", async () => testErrorPixelTransform("diffOnly"));
});
