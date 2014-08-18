var resemble = require('../resemble.js');
var fs = require('fs');

resemble.outputSettings({
  errorColor: {
    red: 155,
    green: 100,
    blue: 155
  },
  errorType: 'movement',
  transparency: 0.6
});

resemble('People.png').compareTo('People2.png')
  //.ignoreAntialiasing()
  //.ignoreColors()
  .onComplete(function(data){
    console.log(data);
    data.getDiffImage().pack().pipe(fs.createWriteStream('diff.png'));
  });


var fileData1 = fs.readFileSync('People.png');
var fileData2 = fs.readFileSync('People2.png');
resemble(fileData1).compareTo(fileData2)
  //.ignoreAntialiasing()
  //.ignoreColors()
  .ignoreRectangles([[325,170,100,40]])
  .onComplete(function(data){
    console.log('with ignore rectangle:', data);
    data.getDiffImage().pack().pipe(fs.createWriteStream('diffr.png'));
  });
