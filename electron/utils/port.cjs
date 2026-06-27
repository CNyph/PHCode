const net = require('net')
const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '..', '..', 'data')

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
    server.on('error', reject)
  })
}

function saveAIPort(port) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(path.join(dataDir, 'ai-port'), String(port), 'utf-8')
}

module.exports = { getAvailablePort, saveAIPort }
