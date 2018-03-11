module.exports = {
  "parser": "babel-eslint",
  "env": {
    "browser": true
  },
  "extends": [
    "airbnb",
    "plugin:flowtype/recommended"
  ],
  "plugins": [
    "flowtype"
  ],
  "rules": {
    "no-param-reassign": ["error", { "props": false }],
    "no-restricted-syntax": ["off", "ForOfStatement"]
  }
};
