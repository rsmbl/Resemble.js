Resemble.js
==========

Analyse and compare images with Javascript and HTML5. [More info & Resemble.js Demo](http://huddle.github.com/Resemble.js/). Compatible with Node.js.

![Two image diff examples side-by-side, one pink, one yellow.](https://raw.github.com/Huddle/Resemble.js/master/demoassets/readmeimage.jpg "Visual image comparison")

### Get it

`npm install resemblejs`

`bower install resemblejs`

### Example

Retrieve basic analysis on an image:

```javascript
var api = resemble(fileData).onComplete(function(data){
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
var diff = resemble(file).compareTo(file2).ignoreColors().onComplete(function(data){
	console.log(data);
	/*
	{
	  misMatchPercentage : 100, // %
	  isSameDimensions: true, // or false
	  dimensionDifference: { width: 0, height: -1 }, // defined if dimensions are not the same
	  getImageDataUrl: function(){}
	}
	*/
});
```

Scale second image to dimensions of the first one:
```javascript
//diff.useOriginalSize();
diff.scaleToSameSize();
```

You can also change the comparison method after the first analysis:

```javascript
// diff.ignoreNothing();
// diff.ignoreColors();
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
  errorType: 'movement',
  transparency: 0.3,
  largeImageThreshold: 1200,
  useCrossOrigin: false
});
// resembleControl.repaint();
```

By default, the comparison algorithm skips pixels when the image width or height is larger than 1200 pixels. This is there to mitigate performance issues.

You can modify this behaviour by setting the `largeImageThreshold` option to a different value. Set it to **0** to switch it off completely.

`useCrossOrigin` is true by default, you might need to set it to false if you're using [Data URIs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs).

### Node.js

#### Installation

On Node, Resemble uses the `canvas` package instead of the native canvas support in the browser. In order to prevent browser users to be forced into installing canvas, it's included as a peer dependency which means you have to install it alongside resemble.

Canvas relies on some native image manipulation libraries to be install on the system. Simple, detailed instructions for OSX/Windows/Linux can be found [here](https://www.npmjs.com/package/canvas).

*Example commands for installation on OSX*

``` bash
npm install resemblejs
brew install pkg-config cairo libpng jpeg giflib
npm install canvas
```

#### Usage

The API under Node is the same as on the browser with one addition, a promise based `compareImage` convenience function that is used as follows:

``` js
const compareImage = require('resemblejs/compareImage');

// The parameters can be Node Buffers
// data is the same as usual with an additional getBuffer() function
const data = await compareImages(
	fs.readFileSync('./demoassets/People.jpg'),
	fs.readFileSync('./demoassets/People2.jpg')
);

fs.writeFileSync('./output.png', data.getBuffer());
```

#### Tests

To run the tests on Node (using Jest), type:

``` bash
npm run test
```

--------------------------------------

Created by [James Cryer](http://github.com/jamescryer) and the Huddle development team.
