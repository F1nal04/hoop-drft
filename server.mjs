// Custom server: one HTTP server hosting both the Next.js app and the
// remote-draft WebSocket endpoint (/ws). Required because Next route handlers
// can't hold WebSocket upgrades; note this is incompatible with
// `output: "standalone"` (see next docs on custom servers), so the Docker
// image ships regular node_modules instead.
//
// Not compiled by Next — keep this file plain Node-compatible ESM.

import { createServer } from "node:http"
import next from "next"
import { WebSocketServer } from "ws"
import { attachRoomServer } from "./server/rooms.mjs"

const dev = process.env.NODE_ENV !== "production"
const port = parseInt(process.env.PORT || "3000", 10)
const hostname = process.env.HOSTNAME || "localhost"

const app = next({ dev, port, hostname })
const handleRequest = app.getRequestHandler()

await app.prepare()
// Must come after prepare() — the underlying server doesn't exist before it.
const handleNextUpgrade = app.getUpgradeHandler()

const server = createServer((req, res) => handleRequest(req, res))

const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 })
attachRoomServer(wss)

server.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost")
  if (pathname === "/ws") {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req))
  } else {
    // Next handles its own upgrades (dev HMR websocket).
    handleNextUpgrade(req, socket, head)
  }
})

server.listen(port, () => {
  console.log(`> Ready on http://${hostname}:${port} (${dev ? "dev" : "production"})`)
})
