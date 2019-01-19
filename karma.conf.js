module.exports = function(config) {
  config.set({
    frameworks: ["mocha", "chai", "sinon-chai", "sinon-chrome"],
    files: ["src/js/**/*.js", "test/UnitTests/*.js"],

    reporters: ["progress", "html", "coverage", "spec"], //,"text","text-summary"],
    preprocessors: {
      "src/js/**/*.js": ["coverage"]
    },

    coverageReporter: {
      instrumenterOptions: {
        istanbul: { noCompact: true }
      },
      reporters: [{ type: "lcov" }]
    },
    //,{ type: 'text'},{ type: 'text-summary'}]},
    port: 9876, // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ["ChromeHeadlessNoSandbox", "Chrome"],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: "ChromeHeadless",
        flags: [
          "--no-sandbox", // required to run without privileges in docker
          //                '--user-data-dir=/tmp/chrome-test-profile',
          "--disable-web-security"
        ]
      }
    },
    autoWatch: false,
    // singleRun: false, // Karma captures browsers, runs the tests and exits
    concurrency: 2,

    specReporter: {
      maxLogLines: 3, // limit number of lines logged per test
      suppressErrorSummary: true, // do not print error summary
      suppressFailed: false, // do not print information about failed tests
      suppressPassed: false, // do not print information about passed tests
      suppressSkipped: true, // do not print information about skipped tests
      showSpecTiming: false, // print the time elapsed for each spec
      failFast: false // test would finish with error when a first fail occurs.
    },

    htmlReporter: {
      outputDir: "karma_coverage", // where to put the reports
      templatePath: null, // set if you moved jasmine_template.html
      focusOnFailures: true, // reports show failures on start
      namedFiles: false, // name files instead of creating sub-directories
      pageTitle: null, // page title for reports; browser info by default
      urlFriendlyName: false, // simply replaces spaces with _ for files/dirs
      reportName: "report-summary", // report summary filename; browser info by default

      // experimental
      preserveDescribeNesting: false, // folded suites stay folded
      foldAll: false // reports start folded (only with preserveDescribeNesting)
    }
  });
};
