/* eslint-env jest*/

const resemble = require("../resemble");
const fs = require("fs");

describe("ignore", () => {
    test("ignore antialiasing on", async () => {
        const text = fs.readFileSync("./nodejs-tests/assets/text.png");
        const textAa = fs.readFileSync("./nodejs-tests/assets/textAa.png");

        return new Promise((resolve) => {
            const opts = { ignore: "antialiasing" };

            resemble.compare(text, textAa, opts, (_x, data) => {
                expect(data.misMatchPercentage).toBe("0.00");
                const buffer = data.getBuffer();

                expect(buffer).toBeInstanceOf(Buffer);

                const comparison = fs.readFileSync("./nodejs-tests/assets/isAntialiased/diffOn.png");

                expect(buffer.equals(comparison)).toBe(true);
                resolve();
            });
        });
    });

    test("ignore antialiasing off", async () => {
        const text = fs.readFileSync("./nodejs-tests/assets/text.png");
        const textAa = fs.readFileSync("./nodejs-tests/assets/textAa.png");

        return new Promise((resolve) => {
            resemble.compare(text, textAa, {}, (_x, data) => {
                expect(data.misMatchPercentage).toBe("5.19");
                const buffer = data.getBuffer();

                expect(buffer).toBeInstanceOf(Buffer);

                const comparison = fs.readFileSync("./nodejs-tests/assets/isAntialiased/diffOff.png");

                expect(buffer.equals(comparison)).toBe(true);
                resolve();
            });
        });
    });
});
