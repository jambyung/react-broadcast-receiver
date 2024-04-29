/* eslint-env node */

const formatCommand = 'prettier --write';
const stylelintCommand = 'stylelint --allow-empty-input "**/*.{css,scss}"';
module.exports = {
  'lib/*.{js,jsx,ts,tsx}': [formatCommand, 'eslint'],
  'lib/*.{css,scss}': [formatCommand, stylelintCommand],
  'lib/!*.{js,jsx,ts,tsx,css,scss}': [formatCommand],
};
