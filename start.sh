#!/usr/bin/env bash
# RECON app: build a static directory and serve it in the foreground.
set -euo pipefail
cd "$(dirname "$0")"
PROJECT_ROOT="$(pwd)"
PORT="${PORT:-3000}"
export PORT
SRC_DIR="$PROJECT_ROOT/app-accidentes-trafico"
DIST_DIR="$PROJECT_ROOT/dist"
export DIST_DIR
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
DEPLOY_OUT="$WEB_DIR/deployment-output.json"
LEGACY_OUT="/home/runner/work/_temp/omgithub-web/deployment-output.json"

/usr/bin/time -p mkdir -p "$DIST_DIR" "$WEB_DIR"
/usr/bin/time -p test -f "$SRC_DIR/index.html"
/usr/bin/time -p test -f "$SRC_DIR/app.js"
/usr/bin/time -p test -f "$SRC_DIR/styles.css"
# Install dependencies when the project declares any (static app: no-op otherwise).
if /usr/bin/time -p test -f "$PROJECT_ROOT/package.json"; then
  if /usr/bin/time -p test -f "$PROJECT_ROOT/package-lock.json"; then
    /usr/bin/time -p npm ci --no-audit --no-fund --prefix "$PROJECT_ROOT"
  else
    /usr/bin/time -p npm install --no-audit --no-fund --prefix "$PROJECT_ROOT"
  fi
  if node -e "process.exit(require('./package.json').scripts?.build?0:1)"; then
    /usr/bin/time -p npm run build --prefix "$PROJECT_ROOT"
  fi
fi
# Build step for this static app: sync sources into the served directory.
/usr/bin/time -p cp -f "$SRC_DIR/index.html" "$SRC_DIR/styles.css" "$SRC_DIR/app.js" "$DIST_DIR"/
/usr/bin/time -p test -f "$DIST_DIR/index.html"
/usr/bin/time -p ls "$DIST_DIR"
/usr/bin/time -p node -e 'const fs=require("fs");const [o,p,d]=process.argv.slice(1);fs.writeFileSync(o,JSON.stringify({project:p,directory:d}));' "$DEPLOY_OUT" "$PROJECT_ROOT" "$DIST_DIR"
if /usr/bin/time -p test "$DEPLOY_OUT" != "$LEGACY_OUT"; then
  /usr/bin/time -p cp -f "$DEPLOY_OUT" "$LEGACY_OUT"
fi
/usr/bin/time -p cat "$DEPLOY_OUT"
echo "Serving $DIST_DIR on port $PORT (project $PROJECT_ROOT)"
# Foreground server (long-lived by design; left untimed so timing wraps setup only).
exec node -e '
const http=require("http"),fs=require("fs"),path=require("path");
const root=process.env.DIST_DIR,port=Number(process.env.PORT||3000);
const mime={".html":"text/html",".js":"application/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};
http.createServer((req,res)=>{
  try{
    const u=new URL(req.url,"http://localhost");
    let p=path.resolve(root,"."+decodeURIComponent(u.pathname));
    if(p!==root&&!p.startsWith(root+"/")){res.writeHead(404);res.end();return;}
    if(fs.statSync(p).isDirectory())p=path.join(p,"index.html");
    res.setHeader("Content-Type",mime[path.extname(p)]||"application/octet-stream");
    res.setHeader("Cache-Control","no-cache");
    res.end(fs.readFileSync(p));
  }catch{res.writeHead(404);res.end("Not found");}
}).listen(port,"0.0.0.0",()=>console.log("listening on "+port+" serving "+root));
'
