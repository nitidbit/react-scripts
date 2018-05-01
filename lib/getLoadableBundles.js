const path = require('path');

let getLoadableBundles;

try {
  const getBundles = require('@7rulnik/react-loadable/webpack').getBundles;
  const stats = require(path.resolve('build/react-loadable.json'));
  getLoadableBundles = modules => getBundles(stats, modules);
} catch (e) {
  getLoadableBundles = () => console.log(e.stack || e.message || e);
}

module.exports = getLoadableBundles;
