const http=require('http'),fs=require('fs'),path=require('path');
const root=process.cwd();
const routes={'/':'/index.html','/demo-menu':'/pages/demo-menu.html','/demo-admin':'/pages/demo-admin.html','/coffee-menu-demo':'/pages/coffee-menu-demo.html','/lee-you-menu':'/pages/lee-you-menu.html'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'};
http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');const f=path.resolve(root,'.'+(routes[u.pathname]||decodeURIComponent(u.pathname)));if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,data)=>{if(e){res.writeHead(404).end('Not found');return}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'}).end(data)})}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
