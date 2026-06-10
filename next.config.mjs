/** @type {import('next').NextConfig} */
const nextConfig = {
  // No `output: "standalone"` — the app runs through the custom server
  // (server.mjs) for the remote-draft WebSocket endpoint, and Next doesn't
  // support standalone output together with a custom server.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactCompiler: true,
}

export default nextConfig
