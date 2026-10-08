/**
 * 官网本地预览服务器（零依赖）
 * 运行：node serve.mjs  然后访问 http://127.0.0.1:8080
 * 说明：仅用于本地预览；部署到静态托管时不需要此文件。
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT || 8080)

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.exe': 'application/octet-stream'
}

http
  .createServer((req, res) => {
    let filePath = path.join(root, decodeURIComponent(req.url.split('?')[0]))
    if (filePath.endsWith(path.sep)) filePath = path.join(filePath, 'index.html')
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        return res.end('404 Not Found')
      }
      res.writeHead(200, {
        'Content-Type': mime[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': stat.size
      })
      fs.createReadStream(filePath).pipe(res)
    })
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`官网预览已启动：http://127.0.0.1:${port}`)
  })
