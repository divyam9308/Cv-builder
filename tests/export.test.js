import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleResume,templates,blankResume,newId} from '../public/lib/domain.js';
import {renderPDF} from '../server/pdf.js';
import {renderDOCX} from '../server/docx.js';
function pdfPages(bytes){const ascii=bytes.toString('latin1');const match=ascii.match(/\/Type \/Pages \/Kids \[[^\]]*\] \/Count (\d+)/);return Number(match?.[1]||0)}
test('every one of five layouts exports a valid PDF and DOCX',()=>{const r=sampleResume();for(const t of templates){const pdf=renderPDF(r,t.id),docx=renderDOCX(r,t.id);assert.equal(pdf.subarray(0,8).toString('latin1'),'%PDF-1.4');assert.equal(docx.subarray(0,2).toString(),'PK');assert.ok(pdf.length>3500);assert.ok(docx.length>3500);assert.ok(pdfPages(pdf)>=1)}});
test('sample fits single-page PDF and 15-job resume paginates',()=>{const r=sampleResume();assert.equal(pdfPages(renderPDF(r)),1);for(let i=0;i<15;i++)r.experience.push({id:newId(),role:'Consultant',organization:'Firm',start:'2024',end:'2025',location:'Delhi',bullets:[`Managed stakeholder reporting and reviewed completed deliverables for engagement ${i+1}.`, 'Built a coordinated delivery calendar and documented risks.','Presented workstream updates to partners and technical teams.']});assert.ok(pdfPages(renderPDF(r))>=3)});
test('short or empty resume exports without crashing',()=>{const r=blankResume();assert.ok(renderPDF(r).length>1000);assert.ok(renderDOCX(r).length>1000)});
test('DOCX contains the expected Word part paths',()=>{const b=renderDOCX(sampleResume()).toString('latin1');assert.ok(b.includes('word/document.xml'));assert.ok(b.includes('word/styles.xml'));assert.ok(b.includes('word/numbering.xml'))});
