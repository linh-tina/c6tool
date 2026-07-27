module.exports = {
  apps: [
    {
      name: "c6tool",
      cwd: __dirname,
      script: "dist/cli.js",
      interpreter: "node",
      time: true,
      autorestart: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
