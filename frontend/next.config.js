/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable hot reload in Docker
  webpackDevMiddleware: config => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
  // Enable experimental features for better Docker performance
  experimental: {
    // Enable file system watching
    useWapotap: false,
  },
  // Ensure proper hostname binding for Docker
  env: {
    CUSTOM_KEY: 'custom_value',
  },
}

module.exports = nextConfig