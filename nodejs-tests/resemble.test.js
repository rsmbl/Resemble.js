/* eslint-env jest*/

const resemble = require("../resemble");
const fs = require("fs");

describe("resemble", () => {
    test("base64", () => {
        const peopleSrc = `data:image/jpeg;base64,${fs.readFileSync("./demoassets/People.jpg", "base64")}`;
        const people2Src = `data:image/jpeg;base64,${fs.readFileSync("./demoassets/People2.jpg", "base64")}`;

        return new Promise((resolve) => {
            resemble(peopleSrc)
                .compareTo(people2Src)
                .onComplete((data) => {
                    expect(data.diffBounds.bottom).toEqual(431);
                    expect(data.diffBounds.left).toEqual(22);
                    expect(data.diffBounds.right).toEqual(450);
                    expect(data.diffBounds.top).toEqual(58);
                    expect(data.dimensionDifference.height).toEqual(0);
                    expect(data.dimensionDifference.width).toEqual(0);
                    expect(data.isSameDimensions).toBe(true);
                    expect(data.misMatchPercentage).toEqual("8.66");
                    resolve();
                });
        });
    });

    test("files", () => {
        return new Promise((resolve) => {
            resemble("demoassets/People.jpg")
                .compareTo("demoassets/People2.jpg")
                .onComplete((data) => {
                    expect(data.diffBounds).toEqual(
                        expect.objectContaining({
                            bottom: expect.any(Number),
                            left: expect.any(Number),
                            top: expect.any(Number),
                            right: expect.any(Number)
                        })
                    );

                    expect(data.diffBounds.bottom).toEqual(431);
                    expect(data.diffBounds.left).toEqual(22);
                    expect(data.diffBounds.right).toEqual(450);
                    expect(data.diffBounds.top).toEqual(58);
                    expect(data.dimensionDifference.height).toEqual(0);
                    expect(data.dimensionDifference.width).toEqual(0);
                    expect(data.isSameDimensions).toBe(true);
                    expect(data.misMatchPercentage).toEqual("8.66");
                    resolve();
                });
        });
    });

    test("file not found", () =>
        new Promise((resolve) => {
            resemble("../demoassets/People.jpg")
                .compareTo("../demoassets/404-image.jpg")
                .onComplete((data) => {
                    expect(data.error).toEqual("Error: ENOENT, No such file or directory '../demoassets/People.jpg'");
                    resolve();
                });
        }));

    test("node buffers jpg", () => {
        const people = fs.readFileSync("./demoassets/People.jpg");
        const people2 = fs.readFileSync("./demoassets/People2.jpg");

        return new Promise((resolve) => {
            resemble(people)
                .compareTo(people2)
                .onComplete((data) => {
                    expect(data.diffBounds.bottom).toEqual(431);
                    expect(data.diffBounds.left).toEqual(22);
                    expect(data.diffBounds.right).toEqual(450);
                    expect(data.diffBounds.top).toEqual(58);
                    expect(data.dimensionDifference.height).toEqual(0);
                    expect(data.dimensionDifference.width).toEqual(0);
                    expect(data.isSameDimensions).toBe(true);
                    expect(data.misMatchPercentage).toEqual("8.66");
                    resolve();
                });
        });
    });

    test("node buffers png", () => {
        const people = fs.readFileSync("./demoassets/ghost1.png");
        const people2 = fs.readFileSync("./demoassets/ghost2.png");

        return new Promise((resolve) => {
            resemble(people)
                .compareTo(people2)
                .onComplete((data) => {
                    expect(data.diffBounds.bottom).toEqual(138);
                    expect(data.diffBounds.left).toEqual(90);
                    expect(data.diffBounds.right).toEqual(157);
                    expect(data.diffBounds.top).toEqual(107);
                    expect(data.dimensionDifference.height).toEqual(0);
                    expect(data.dimensionDifference.width).toEqual(0);
                    expect(data.isSameDimensions).toBe(true);
                    expect(data.misMatchPercentage).toEqual("0.27");
                    resolve();
                });
        });
    });

    test("partial diff with single bounding box", () => {
        const people = fs.readFileSync("./demoassets/ghost1.png");
        const people2 = fs.readFileSync("./demoassets/ghost2.png");

        return new Promise((resolve) => {
            resemble.outputSettings({
                boundingBox: {
                    left: 80,
                    top: 80,
                    right: 130,
                    bottom: 130
                }
            });

            resemble(people)
                .compareTo(people2)
                .onComplete((data) => {
                    expect(data.misMatchPercentage).toEqual("0.04");
                    resolve();
                });
        });
    });

    test("error pixel color", () => {
        const people = fs.readFileSync("./demoassets/ghost1.png");
        const people2 = fs.readFileSync("./demoassets/ghost2.png");

        return new Promise((resolve) => {
            resemble.outputSettings({
                errorColor: {
                    red: 0,
                    green: 255,
                    blue: 0
                }
            });

            resemble(people)
                .compareTo(people2)
                .onComplete((data) => {
                    const buffer = data.getBuffer();

                    expect(buffer).toBeInstanceOf(Buffer);
                    expect(buffer.length).toBe(9391);

                    const comparison = fs.readFileSync("./nodejs-tests/assets/pixelErrorColorTest.png");
                    expect(buffer.equals(comparison)).toBe(true);
                    resolve();
                });
        });
    });

    test("partial diff with bounding boxes", () => {
        const people = fs.readFileSync("./nodejs-tests/assets/text.png");
        const people2 = fs.readFileSync("./nodejs-tests/assets/textAa.png");

        return new Promise((resolve) => {
            resemble.outputSettings({
                boundingBoxes: [
                    {
                        left: 20,
                        top: 20,
                        right: 350,
                        bottom: 80
                    },
                    {
                        left: 20,
                        top: 200,
                        right: 350,
                        bottom: 250
                    }
                ]
            });

            resemble(people)
                .compareTo(people2)
                .onComplete((data) => {
                    expect(data.misMatchPercentage).toEqual("3.39");
                    resolve();
                });
        });
    });

    test("partial diff with ignored boxes", () => {
        const people = fs.readFileSync("./nodejs-tests/assets/text.png");
        const people2 = fs.readFileSync("./nodejs-tests/assets/textAa.png");

        return new Promise((resolve) => {
            resemble.outputSettings({
                ignoredBoxes: [
                    {
                        left: 20,
                        top: 20,
                        right: 350,
                        bottom: 80
                    },
                    {
                        left: 20,
                        top: 200,
                        right: 350,
                        bottom: 250
                    }
                ]
            });

            resemble(people)
                .compareTo(people2)
                .onComplete((data) => {
                    expect(data.misMatchPercentage).toEqual("1.80");
                    resolve();
                });
        });
    });

    test("partial diff with single ignored box", () => {
        const people = fs.readFileSync("./nodejs-tests/assets/text.png");
        const people2 = fs.readFileSync("./nodejs-tests/assets/textAa.png");

        return new Promise((resolve) => {
            resemble.outputSettings({
                ignoredBox: {
                    left: 20,
                    top: 20,
                    right: 350,
                    bottom: 80
                }
            });

            resemble(people)
                .compareTo(people2)
                .onComplete((data) => {
                    expect(data.misMatchPercentage).toEqual("3.52");
                    resolve();
                });
        });
    });

    test("returns early", () => {
        const people = fs.readFileSync("./nodejs-tests/assets/text.png");
        const people2 = fs.readFileSync("./nodejs-tests/assets/textAa.png");

        return new Promise((resolve) => {
            resemble(people)
                .compareTo(people2)
                .setReturnEarlyThreshold(2)
                .onComplete((data) => {
                    expect(data.misMatchPercentage).toEqual("2.00");
                    resolve();
                });
        });
    });

    test("partial diff with ignored color", () => {
        const peopleSrc = `data:image/jpeg;base64,${fs.readFileSync("./nodejs-tests/assets/PeopleWithIgnoreMask.png", "base64")}`;
        const people2Src = `data:image/jpeg;base64,${fs.readFileSync("./demoassets/People2.jpg", "base64")}`;

        return new Promise((resolve) => {
            resemble.outputSettings({
                ignoreAreasColoredWith: {
                    r: 255,
                    g: 0,
                    b: 0,
                    a: 255
                }
            });

            resemble(people2Src)
                .compareTo(peopleSrc)
                .onComplete((data) => {
                    const buffer = data.getBuffer();
                    const comparison = fs.readFileSync("./nodejs-tests/assets/ignoredColorTestResult.png");
                    expect(buffer.equals(comparison)).toBe(true);
                    resolve();
                });
        });
    });
});
