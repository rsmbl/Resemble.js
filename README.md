**Ultra low-maintenance mode**: One or two times a year the library author will spend some time to keep the library useful. Feel free to raise issues and contribute improvements, but please be aware that it may be sometime before a response is given.

---

<h1 align="center"><img src="https://raw.github.com/rsmbl/Resemble.js/master/demoassets/resemble.png" alt="Resemble.js" width="256"/></h1>

<p align="center">
    <a href="https://github.com/rsmbl/Resemble.js/actions"><img alt="Build Status" src="https://github.com/rsmbl/Resemble.js/actions/workflows/CI.yml/badge.svg" /></a>
    <a href="https://www.codacy.com/gh/rsmbl/Resemble.js/dashboard?utm_source=github.com&utm_medium=referral&utm_content=rsmbl/Resemble.js&utm_campaign=Badge_Coverages"><img alt="Coverage" src="https://app.codacy.com/project/badge/Coverage/97c5e9c42bcf4b4bbc2271882f18c502" /></a>
    <a href="https://www.codacy.com/gh/rsmbl/Resemble.js/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=rsmbl/Resemble.js&amp;utm_campaign=Badge_Grade"><img alt="Code Health" src="https://app.codacy.com/project/badge/Grade/97c5e9c42bcf4b4bbc2271882f18c502" /></a>
    <a href="https://opensource.org/licenses/MIT"><img alt="MIT License" src="https://img.shields.io/badge/License-MIT-yellow.svg" /></a>
    <a href="https://www.npmjs.com/package/resemblejs"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/resemblejs.svg" /></a>

</p>

<p align="center">
  Analyse and compare images with Javascript and HTML5. <a href="http://rsmbl.github.io/Resemble.js/">More info & Resemble.js Demo</a>. Compatible with Node.js >8.
</p>

<hr />

### Get it

`npm install resemblejs`

### Node.js

Resemble.js uses [node-canvas](https://www.npmjs.com/package/canvas) for Node.js support. This is a pre-built dependency that may fail in certain environments. If you are using Resemble.js for in-browser analysis only, you can skip the node-canvas dependency with `npm install --no-optional`. If you need Node.js support and the Canvas dependency fails, try: Using a previous version of Resemble.js, or [NPM overrides](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides) to specify a [more recent version of node-canvas](https://github.com/Automattic/node-canvas/releases), or `npm install --build-from-source`.

### Example

Retrieve basic analysis on an image:

```javascript
var api = resemble(fileData).onComplete(function (data) {
    console.log(data);
    /*
	{
	  red: 255,
	  green: 255,
	  blue: 255,
	  brightness: 255
	}
	*/
});
```

Use resemble to compare two images:

```javascript
var diff = resemble(file)
    .compareTo(file2)
    .ignoreColors()
    .onComplete(function (data) {
        console.log(data);
    });
```

Scale second image to dimensions of the first one:

```javascript
diff.scaleToSameSize();
```

You can also change the comparison method after the first analysis:

```javascript
diff.ignoreAntialiasing();
```

And change the output display style:

```javascript
resemble.outputSettings({
    errorColor: {
        red: 255,
        green: 0,
        blue: 255
    },
    errorType: "movement",
    transparency: 0.3,
    largeImageThreshold: 1200,
    useCrossOrigin: false,
    outputDiff: true
});
// .repaint();
```

> Note: `resemble.outputSettings` mutates global state, effecting all subsequent call to Resemble.

It is possible to narrow down the area of comparison, by specifying a bounding box measured in pixels from the top left:

```javascript
const box = {
    left: 100,
    top: 200,
    right: 200,
    bottom: 600
};
resemble.outputSettings({ boundingBox: box });
```

```javascript
resemble.outputSettings({ boundingBoxes: [box1, box2] });
```

You can also exclude part of the image from comparison, by specifying the excluded area in pixels from the top left:

```javascript
const box = {
    left: 100,
    top: 200,
    right: 200,
    bottom: 600
};
resemble.outputSettings({ ignoredBox: box });
```

```javascript
resemble.outputSettings({ ignoredBoxes: [box1, box2] });
```

Another way to exclude parts of the image from comparison, is using the `ignoreAreasColoredWith` option.
Any pixels that match the specified color on a reference image will be excluded from comparison:

```javascript
const color = {
    r: 255,
    g: 0,
    b: 0,
    a: 255
};
resemble.outputSettings({ ignoreAreasColoredWith: color });
```

By default, the comparison algorithm skips pixels when the image width or height is larger than 1200 pixels. This is there to mitigate performance issues.

You can modify this behaviour by setting the `largeImageThreshold` option to a different value. Set it to **0** to switch it off completely.

Resemble.js also supports Data URIs as strings:

```javascript
resemble.outputSettings({ useCrossOrigin: false });
var diff = resemble("data:image/jpeg;base64,/9j/4AAQSkZJRgAB...").compareTo("data:image/jpeg;base64,/9j/,/9j/4AAQSkZJRg...");
```

`useCrossOrigin` is true by default, you might need to set it to false if you're using [Data URIs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs).

If you'd like resemble to return early:

```javascript
resemble(img1)
    .compareTo(img2)
    .setReturnEarlyThreshold(8)
    .onComplete((data) => {
        /* do something */
    });
```

### Single callback api

The resemble.compare API provides a convenience function that is used as follows:

```js
const compare = require("resemblejs").compare;

function getDiff() {
    const options = {
        returnEarlyThreshold: 5
    };

    compare(image1, image2, options, function (err, data) {
        if (err) {
            console.log("An error!");
        } else {
            console.log(data);
        }
    });
}
```

### Node.js

#### Usage

The API under Node is the same as on the `resemble.compare` but promise based:

```js
const compareImages = require("resemblejs/compareImages");
const fs = require("mz/fs");

async function getDiff() {
    const options = {
        output: {
            errorColor: {
                red: 255,
                green: 0,
                blue: 255
            },
            errorType: "movement",
            transparency: 0.3,
            largeImageThreshold: 1200,
            useCrossOrigin: false,
            outputDiff: true
        },
        scaleToSameSize: true,
        ignore: "antialiasing"
    };

    const data = await compareImages(await fs.readFile("./your-image-path/People.jpg"), await fs.readFile("./your-image-path/People2.jpg"), options);

    await fs.writeFile("./output.png", data.getBuffer());
}

getDiff();
```

#### Tests

To run the tests on Node (using Jest), type:

```bash
npm run test
```

There are also some in-browser tests. To run these install and run a http-server such as [http-server](https://github.com/indexzero/http-server) from the root of the project. Then in the browser, navigate to `localhost:8080/chai-tests/test.html`, open up the developer console to see the results.

#### Dockerfile

For convenience I've added a simple Dockerfile to run the NodeJS tests in an Ubuntu container

```bash
docker build -t rsmbl/resemble .
docker run rsmbl/resemble
```

#### Reference to academic papers

As people have asked in the past, Resemble.js hasn't knowingly implemented any published ideas. RGBA colour comparison is simple and straightforward when working with the Canvas API. The antialiasing algorithm was developed at [Huddle](https://github.com/HuddleEng) over several days of trial-and-error using various false-positive results from PhantomCSS tests.

---

Created by [James Cryer](http://github.com/jamescryer) and the [Huddle development team](https://github.com/HuddleEng).
