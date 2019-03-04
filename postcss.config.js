const postcssCustomProperties = require('postcss-custom-properties');

module.exports = {
  plugins: [
    postcssCustomProperties({
      preserve: true,
      importFrom: 'semantic_theming/site/globals/site.overrides',
    })
  ]
};
