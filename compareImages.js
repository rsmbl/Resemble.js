const resemble = require('./resemble');

module.exports = async function(image1, image2) {
  return new Promise(function(resolve, reject) {
    resemble(image1).compareTo(image2).onComplete(function(data) {
      if (data.error) {
        reject(data.error);
      } else {
        resolve(data);
      }
    });
  });
};
