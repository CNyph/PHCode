const path = require('path')
const { spawn } = require('child_process')

let aiProcess = null

function startAIService(isDev, port) {
  if (!isDev) return

  const aiDir = path.join(__dirname, '..', '..', 'ai')
  aiProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: aiDir,
    shell: true,
    stdio: 'pipe',
    env: {
      ...process.env,
      PORT: String(port),
      NO_PROXY: '127.0.0.1,localhost',
      no_proxy: '127.0.0.1,localhost'
    }
  })

  aiProcess.stdout?.on('data', (data) => {
    console.log(`[AI] ${data.toString().trim()}`)
  })

  aiProcess.stderr?.on('data', (data) => {
    console.error(`[AI Error] ${data.toString().trim()}`)
  })

  aiProcess.on('error', (err) => {
    console.error('[AI] Failed to start:', err)
  })
}

function stopAIService() {
  if (aiProcess) {
    aiProcess.kill()
    aiProcess = null
  }
}

module.exports = { startAIService, stopAIService }
