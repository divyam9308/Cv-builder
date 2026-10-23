import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderPDF} from './pdf.js';
import {renderDOCX} from './docx.js';
import {getAIQuestions,rewriteBullet,geminiConfigured} from './gemini.js';
import {normalizeResume} from '../public/lib/domain.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
// Lightweight .env loader: local configuration only, never exposed as static content.
function loadEnv(){const filename=path.resolve(root,'../.env');if(!fs.existsSync(filename))return;for(const line of fs.readFileSync(filename,'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}
loadEnv();
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.ico':'image/x-icon'};
const send=(res,status,body,headers={})=>{res.writeHead(status,{'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",...headers});res.end(body)};
const json=(res,status,obj)=>send(res,status,JSON.stringify(obj),{'Content-Type':'application/json; charset=utf-8'});
const limiter=new Map();function limited(addr){const now=Date.now();const old=limiter.get(addr)||[];const recent=old.filter(t=>now-t<10*60*1000);recent.push(now);limiter.set(addr,recent);return recent.length>40}
function body(req){return new Promise((resolve,reject)=>{let data='';req.on('data',chunk=>{data+=chunk;if(data.length>850000){reject(Object.assign(new Error('Request is too large'),{status:413}));req.destroy()}});req.on('end',()=>{try{resolve(JSON.parse(data))}catch{reject(Object.assign(new Error('Invalid JSON'),{status:400}))}});req.on('error',reject)})}
function filename(s){return String(s||'resume').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,65)||'resume'}
export function createServer(){return http.createServer(async(req,res)=>{
  try{const requestURL=new URL(req.url,'http://localhost');const pathname=requestURL.pathname;
    if(req.method==='GET'&&pathname==='/api/health')return json(res,200,{status:'ok',mode:'local',geminiConfigured:geminiConfigured(),model:geminiConfigured()?process.env.GEMINI_MODEL||'gemini-3.5-flash-lite':null});
    if(req.method==='POST'&&pathname.startsWith('/api/')){
      const origin=req.headers.origin;if(origin){const requested=new URL(origin);if(!['127.0.0.1','localhost','[::1]'].includes(requested.hostname)||requested.host!==req.headers.host)return json(res,403,{error:'Cross-origin requests are blocked'})}
      if(limited(req.socket.remoteAddress||'localhost'))return json(res,429,{error:'Too many requests; try again shortly.'});
      const data=await body(req);
      if(pathname==='/api/export/pdf'||pathname==='/api/export/docx'){
        const resume=normalizeResume(data.resume);const format=pathname.endsWith('pdf')?'pdf':'docx';const output=format==='pdf'?renderPDF(resume,data.templateId):renderDOCX(resume,data.templateId);return send(res,200,output,{'Content-Type':format==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':`attachment; filename="${filename(resume.personal.name||resume.name)}-${filename(data.templateId||resume.template)}.${format}"`})}
      if(pathname==='/api/ai/questions'||pathname==='/api/ai/rewrite'){
        if(!geminiConfigured())return json(res,503,{error:'Gemini key not configured. The local interview and exports still work.'});const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),28000);try{const result=pathname.endsWith('questions')?{questions:await getAIQuestions(data.resume,controller.signal)}:await rewriteBullet(data,controller.signal);return json(res,200,result)}finally{clearTimeout(timeout)}}
      return json(res,404,{error:'Unknown endpoint'});
    }
    if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed'});
    const relative=pathname==='/'?'index.html':decodeURIComponent(pathname).replace(/^\/+/, '');
    const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep))return json(res,403,{error:'Forbidden'});
    let info;try{info=fs.statSync(file)}catch{return json(res,404,{error:'Not found'})}if(!info.isFile())return json(res,404,{error:'Not found'});
    const content=fs.readFileSync(file);return send(res,200,req.method==='HEAD'?'':content,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':'public, max-age=60'});
  }catch(err){if(!res.writableEnded&&!res.destroyed)json(res,err.status||500,{error:err.status?err.message:'An unexpected server error occurred.'});if(err.status!==400&&err.status!==503)console.error('[request]',err.message)}
})}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){const port=Number(process.env.PORT||4173);createServer().listen(port,'127.0.0.1',()=>console.log(`CV Studio → http://127.0.0.1:${port}\nGemini: ${geminiConfigured()?'configured':'offline mode (add GEMINI_API_KEY to .env)'}`))}
