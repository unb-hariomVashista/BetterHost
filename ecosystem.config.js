module.exports = {
  apps: [
    {
      name: "betterhost-api",
      cwd: "./apps/api",
      script: "./bin/api",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        PORT: "8080",
        ENV: "production",
        STORAGE_DIR: "./storage"
      }
    },
    {
      name: "betterhost-web",
      cwd: "./apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        PORT: "3000",
        NODE_ENV: "production"
      }
    }
  ]
};
