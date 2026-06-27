const path = require('path')
const { spawn } = require('child_process')
const { pathToFileURL } = require('url')

let serverProcess = null
let embeddedServerModule = null

async function startServer(isDev, aiPort) {
  if (isDev) {
    const serverDir = path.join(__dirname, '..', '..', 'server')
    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: serverDir,
      shell: true,
      stdio: 'pipe',
      env: { ...process.env, AI_SERVICE_URL: `http://localhost:${aiPort}` }
    })

    serverProcess.stdout?.on('data', (data) => {
      console.log(`[Server] ${data.toString().trim()}`)
    })

    serverProcess.stderr?.on('data', (data) => {
      console.error(`[Server Error] ${data.toString().trim()}`)
    })

    serverProcess.on('error', (err) => {
      console.error('[Server] Failed to start:', err)
    })

    return
  }

  process.env.PHCODE_MANAGED_SERVER = '1'

  const serverEntry = path.join(__dirname, '..', '..', 'server', 'dist', 'server', 'src', 'index.js')
  const moduleUrl = pathToFileURL(serverEntry).href
  embeddedServerModule = await import(moduleUrl)
  if (embeddedServerModule?.startServer) {
    await embeddedServerModule.startServer()
  }
}

async function stopServer() {
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
    return
  }

  if (embeddedServerModule?.stopServer) {
    await embeddedServerModule.stopServer()
    embeddedServerModule = null
  }
}

module.exports = { startServer, stopServer }
