var resemble = require('./resemble');

module.exports = function(image1, image2, options) {
  return new Promise(function(resolve, reject) {
    resemble.compare(image1, image2, options, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};
