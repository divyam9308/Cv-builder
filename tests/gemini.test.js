import test from 'node:test';
import assert from 'node:assert/strict';
import {getAIQuestions,rewriteBullet} from '../server/gemini.js';
import {sampleResume} from '../public/lib/domain.js';
const oldKey=process.env.GEMINI_API_KEY,oldFetch=global.fetch;
function mock(out){global.fetch=async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(out)}]}}]}),{status:200,headers:{'Content-Type':'application/json'}});process.env.GEMINI_API_KEY='TEST_ONLY_NOT_REAL'}
test.after(()=>{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey});
test('Gemini questions accept only real entry IDs and valid targets',async()=>{const r=sampleResume();mock({questions:[{id:'q1',title:'What precisely did you change during the internship?',target:{section:'experience',itemId:r.experience[0].id},kind:'impact'},{id:'q2',title:'Invent an answer for another user?',target:{section:'experience',itemId:'fake-id'},kind:'impact'}]});const out=await getAIQuestions(r);assert.equal(out.length,1);assert.equal(out[0].target.itemId,r.experience[0].id)});
test('AI rewrite cannot introduce unsupported numeric claims',async()=>{const r=sampleResume();mock({rewritten:'Delivered a 47% revenue increase by managing people.',explanation:'Good'});await assert.rejects(rewriteBullet({resume:r,source:'Managed social pages.',answer:'Created a content calendar',question:'What did you do?'}),/unverified number/i)});
test('AI rewrite returns a suggestion but does not mutate the resume',async()=>{const r=sampleResume(),before=JSON.stringify(r);mock({rewritten:'Created weekly product analytics dashboards using SQL.',explanation:'More specific'});const out=await rewriteBullet({resume:r,source:'Built dashboards.',answer:'Created weekly product analytics dashboards using SQL.',question:'What did you do?'});assert.match(out.rewritten,/SQL/);assert.equal(JSON.stringify(r),before)});
