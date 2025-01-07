const { cleanEnv } = require('envalid');
const { port, str } = require('envalid/dist/validators');

module.exports = cleanEnv(process.env, {
  MONGO_CONNECTION_STRING: str(),
  PORT: port(),
  ACCESS_TOKEN_SECRET: str(),
  REFRESH_TOKEN_SECRET: str(),
  ACCESS_TOKEN_LIFE: str(),
  REFRESH_TOKEN_LIFE: str(),
  COOKIE_SECRET: str(),
  CLOUDFLARE_API_KEY: str(),
  CLOUDFLARE_STREAM_API_TOKEN: str(),
  CLOUDFLARE_ACCOUNT_ID: str(),
  NODE_ENV: str(),
  DEV_URL: str(),
  PRODUCTION_URL: str(),
  NUMBER_OF_PROXIES: str(),
});