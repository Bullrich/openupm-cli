const _ = require("lodash");
const fse = require("fs-extra");
const nock = require("nock");
const path = require("path");
const os = require("os");

const getWorkDir = function(pathToTmp) {
  return path.join(os.tmpdir(), pathToTmp);
};

const createWorkDir = function(pathToTmp, { manifest }) {
  const workDir = getWorkDir(pathToTmp);
  fse.mkdirpSync(workDir);
  if (manifest) {
    if (!_.isObjectLike(manifest)) manifest = { dependencies: {} };
    const manifestDir = path.join(workDir, "Packages");
    fse.mkdirpSync(manifestDir);
    const data = JSON.stringify(manifest);
    fse.writeFileSync(path.join(manifestDir, "manifest.json"), data);
  }
};

const removeWorkDir = function(pathToTmp) {
  const cwd = getWorkDir(pathToTmp);
  fse.removeSync(cwd);
};

// capture stream, modified based on
// https://stackoverflow.com/questions/18543047/mocha-monitor-application-output
function captureStream(stream) {
  var oldWrite = stream.write;
  var buf = "";
  // eslint-disable-next-line no-unused-vars
  stream.write = function(chunk, encoding, callback) {
    let content = chunk.toString();
    const isTest = content.startsWith("[test]");
    if (isTest) content = content.slice(7, content.length);
    buf += content; // chunk is a String or Buffer
    if (!isTest) oldWrite.apply(stream, arguments);
  };

  return {
    unhook: function unhook() {
      stream.write = oldWrite;
    },
    captured: function() {
      return buf;
    }
  };
}

const nockUp = function() {
  if (!nock.isActive()) nock.activate();
};

const nockDown = function() {
  nock.restore();
  nock.cleanAll();
};

module.exports = {
  getWorkDir,
  createWorkDir,
  removeWorkDir,
  captureStream,
  nockUp,
  nockDown
};
