module.exports = {
  extends: ["@commitlint/config-conventional"],
  formatter: "./commitlint-formatter.js",
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "hotfix",
        "refactor",
        "test",
        "style",
        "ops",
        "poc",
        "init",
      ],
    ],
    "subject-empty": [2, "never"],
    "type-empty": [2, "never"],
    "header-max-length": [2, "always", 1000],
  },
};
