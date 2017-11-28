var resemble = require('./resemble');

function applyIgnore(api, ignore) {
  switch (ignore) {
    case 'nothing': api.ignoreNothing();
    case 'less': api.ignoreLess();
    case 'antialiasing': api.ignoreAntialiasing();
    case 'colors': api.ignoreColors();
    case 'alpha': api.ignoreAlpha();
    default: throw new Error('Invalid ignore: ' + ignore);
  }
}

module.exports = function(image1, image2, options) {
  return new Promise(function(resolve, reject) {
    var res = resemble(image1), opt = options || {}, compare;
    if (opt.output) {
      res.outputSettings(opt.output);
    }

    compare = res.compareTo(image2);

    if (opt.scaleToSameSize) {
      compare.scaleToSameSize();
    }

    if (typeof opt.ignore === 'string') {
      applyIgnore(compare, opt.ignore);
    } else if (opt.ignore && opt.ignore.forEach) {
      opt.ignore.forEach(function (v) {
        applyIgnore(compare, v);
      });
    }

    compare.onComplete(function(data) {
      if (data.error) {
        reject(data.error);
      } else {
        resolve(data);
      }
    });
  });
};
