/** Tasks run by lint-staged on git-staged files (via the husky pre-commit hook). */
export default {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,cjs,mjs,json,css,md}": ["prettier --write"],
};
