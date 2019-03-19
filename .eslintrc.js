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
    "flowtype",
    "react-hooks"
  ],
  "rules": {
    "no-param-reassign": ["error", { "props": false }],
    "no-restricted-syntax": ["off", "ForOfStatement"],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
};
