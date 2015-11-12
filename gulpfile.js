var gulp = require('gulp');
var jasmine = require('gulp-jasmine');
var gutil = require('gulp-util');

var srcFiles = 'resemble.js';
var specFiles = 'resemble.spec.js';

function runTests(breakOnError) {
  return gulp.src(specFiles)
    .pipe(jasmine({
      includeStackTrace: true
    }))
    .on('error', errorHandler(breakOnError));
}

function errorHandler(breakOnError) {
  return function(error) {
    if (breakOnError) {
      throw error;
    } else {
      gutil.log(gutil.colors.red('[Jasmine]'), error.toString());
      this.emit('end');
    }
  }
}

gulp.task('test', function() {
  return runTests(true);
});

gulp.task('test:auto', function() {
  runTests(false);

  return gulp.watch([srcFiles, specFiles], function() {
    runTests(false);
  });
});
