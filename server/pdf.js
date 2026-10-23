/** Dependency-free, multi-page selectable-text PDF renderer. Classic Latin text; Unicode fallback: browser Print to PDF. */
import {normalizeResume,templates} from '../public/lib/domain.js';
const PAGE={A4:[595.28,841.89],Letter:[612,792]};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x.toFixed(3)).join(' ');
const clean=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/[\u2013\u2014]/g,'-').replace(/·/g,' / ').replace(/[^\x20-\x7E\n]/g,'?');
const pdfText=s=>clean(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/\n/g,' ');
function wordWrap(s,maxWidth,size){let arr=[];for(const paragraph of String(s??'').split(/\n/)){const words=clean(paragraph).split(/\s+/).filter(Boolean);let line='';for(let word of words){while(word.length*size*.52>maxWidth){if(line){arr.push(line);line=''}const n=Math.max(1,Math.floor(maxWidth/(size*.52)));arr.push(word.slice(0,n));word=word.slice(n)}const trial=line?line+' '+word:word;if(trial.length*size*.47>maxWidth&&line){arr.push(line);line=word}else line=trial}if(line)arr.push(line)}return arr.length?arr:['']}
const between=(...p)=>p.filter(Boolean).join(' | ');
export function renderPDF(input,templateId){const r=normalizeResume(input);const t=templates.find(t=>t.id===(templateId||r.template))||templates[0],variant=t.id;const [W,H]=PAGE[r.pageSize];const margin=variant==='ledger'?54:48,contentW=W-2*margin;let pages=[],commands=[],y=0,page=0;
  const setColor=c=>`${rgb(c)} rg`;
  const line=(x1,y1,x2,y2,color='#D7DCE1',thick=.7)=>{commands.push(`${rgb(color)} RG ${thick} w ${x1.toFixed(2)} ${(H-y1).toFixed(2)} m ${x2.toFixed(2)} ${(H-y2).toFixed(2)} l S`)};
  const rect=(x,yy,w,h,color)=>commands.push(`${setColor(color)} ${x.toFixed(2)} ${(H-yy-h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  const text=(value,x,yy,size=9.1,face='normal',color='#293341')=>commands.push(`BT ${setColor(color)} /${face==='bold'?'F2':face==='serif'?'F3':'F1'} ${size.toFixed(2)} Tf 1 0 0 1 ${x.toFixed(2)} ${(H-yy).toFixed(2)} Tm (${pdfText(value)}) Tj ET`);
  const start=()=>{if(commands.length)pages.push(commands.join('\n'));page++;commands=[];rect(0,0,W,H,'#FFFFFF');if(variant==='northstar'||variant==='atelier')rect(margin,27,variant==='atelier'?36:54,3,t.accent);if(page>1){text(r.personal.name||'RESUME',margin,30,9,'bold',t.accent);text(`PAGE ${page}`,W-margin-37,30,7,'normal','#7D8692');line(margin,40,W-margin,40,'#E1E4E8');}y=page>1?56:60};
  const ensure=(h)=>{if(y+h>H-55)start()};
  const wrap=(s,x,width,size=9.1,leading=13,face='normal',color='#293341')=>{const lines=wordWrap(s,width,size);for(const ln of lines){ensure(leading);text(ln,x,y,size,face,color);y+=leading}};
  const section=(title)=>{ensure(35);y+=10;text(variant==='ledger'?title:(title.toUpperCase()),margin,y,variant==='ledger'?11:9.3,'bold',t.accent);y+=6;line(margin,y,W-margin,y,variant==='clarity'?'#C9CDD1':t.accent,variant==='ledger'?1.05:.65);y+=12};
  const meta=(main,aside,sub)=>{ensure(30);text(main,margin,y,10,'bold','#1D2634');if(aside){const clipped=clean(aside).slice(0,45);text(clipped,W-margin-Math.min(contentW*.48,clipped.length*4.4),y,8.5,'normal','#55606E')}y+=14;if(sub){wrap(sub,margin,contentW,8.6,12,'normal','#55606E');y+=4}};
  const bullet=s=>{const lines=wordWrap(s,contentW-20,9.05);for(let i=0;i<lines.length;i++){ensure(12.6);if(i===0)text('-',margin+3,y,9,'normal',t.accent);text(lines[i],margin+17,y,9.05,'normal','#293341');y+=12.6}y+=4};
  start();
  if(r.personal.name){wrap(r.personal.name,margin,contentW,variant==='ledger'?23:22,26,variant==='ledger'?'serif':'bold',variant==='atelier'?t.accent:'#152248')}else {text('YOUR NAME',margin,y,22,'bold','#152248');y+=26}
  if(r.personal.title){wrap(r.personal.title.toUpperCase(),margin,contentW,9.4,14,'bold',t.accent);y+=5}
  const contact=[r.personal.email,r.personal.phone,r.personal.location,r.personal.linkedin,r.personal.website].filter(Boolean).join('   |   ');if(contact){wrap(contact,margin,contentW,8,12,'normal','#4C5868');y+=7}
  line(margin,y,W-margin,y,variant==='ledger'?'#B5A993':'#CBD2DB',.75);y+=3;
  if(r.summary){section('Professional Summary');wrap(r.summary,margin,contentW,9.2,13.4)}
  if(r.experience.length){section('Professional Experience');for(const x of r.experience){meta(x.role||'Role',between(x.start,x.end).replace(' · ',' – '),between(x.organization,x.location));for(const b of x.bullets)bullet(b);y+=6}}
  if(r.projects.length){section('Projects');for(const p of r.projects){meta(p.title||'Project','',between(p.subtitle,p.link));for(const b of p.bullets)bullet(b);y+=6}}
  if(r.education.length){section('Education');for(const e of r.education){meta(e.degree||'Qualification',between(e.start,e.end).replace(' · ',' – '),between(e.school,e.location));if(e.details)wrap(e.details,margin,contentW,9,13);y+=7}}
  if(r.skills.length){section('Skills');wrap(r.skills.join('  |  '),margin,contentW,9.2,13.5)}
  if(r.certifications.length){section('Certifications');for(const c of r.certifications)bullet(c)}
  if(r.awards.length){section('Awards & Achievements');for(const a of r.awards)bullet(a)}
  pages.push(commands.join('\n'));
  // PDF indirect objects with exact byte offsets; emitted as a Buffer.
  const obj=[];const add=v=>(obj.push(v),obj.length);const catalog=add(''),pagesId=add('');const fontA=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),fontB=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'),fontC=add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>');
  const ids=[];for(const pageText of pages){const data=Buffer.from(pageText,'latin1');const stream=add(`<< /Length ${data.length} >>\nstream\n${pageText}\nendstream`);const pid=add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${fontA} 0 R /F2 ${fontB} 0 R /F3 ${fontC} 0 R >> >> /Contents ${stream} 0 R >>`);ids.push(pid)}
  obj[catalog-1]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;obj[pagesId-1]=`<< /Type /Pages /Kids [${ids.map(i=>`${i} 0 R`).join(' ')}] /Count ${ids.length} >>`;
  let out='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n',offsets=[0];for(let i=0;i<obj.length;i++){offsets.push(Buffer.byteLength(out,'latin1'));out+=`${i+1} 0 obj\n${obj[i]}\nendobj\n`}const xref=Buffer.byteLength(out,'latin1');out+=`xref\n0 ${obj.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)out+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;out+=`trailer\n<< /Size ${obj.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;return Buffer.from(out,'latin1')
}
