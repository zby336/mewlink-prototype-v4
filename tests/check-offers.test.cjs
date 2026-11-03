const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(){
 const data=new Map(),events=[];let blocked=false;
 const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>{if(blocked)throw Error('quota');data.set(k,v);},removeItem:k=>data.delete(k)};
 const root={console,Date,Intl,Math,Set,Map,Event,localStorage:storage,sessionStorage:storage,location:{hash:'#cats'},dispatchEvent:e=>events.push(e.type),addEventListener(){},removeEventListener(){},crypto:{randomUUID:()=>require('node:crypto').randomUUID()},React:{createElement:()=>({})}};
 root.window=root;root.globalThis=root;vm.createContext(root);
 for(const f of ['caregiver-model.js','care-knowledge.js','refinement-model.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',f),'utf8'),root);
 return {M:root.MewLinkCare,D:root.MewLinkData,R:root.MewLinkRefine,data,root,events,block:()=>blocked=true};
}
const now=Date.parse('2026-11-03T20:00:00+08:00');
const request=(D,extra={})=>({id:'request-tiger',catId:'tiger',identity:'confirmed',authorId:'aisha',circleId:D.CIRCLE,visibility:'circle',occurredAt:new Date(now-3600000).toISOString(),observed:'Water bowl nearly empty.',next:'Check and refill the water bowl next visit.',source:'demo',...extra});

test('offer eligibility uses the exact record cited by Recorded next visit suggestions',()=>{
 const {M,D,R}=setup();
 for(const c of M.allCats()){
  const r=R.nextRequest(c.id),item=D.suggestions(c.id).items.find(i=>i.type==='recorded-request');
  assert.equal(!!r,!!item,c.name);if(r)assert(item.sourceIds.includes(r.id));
 }
});

test('offers persist and deduplicate without completing care, resolving a request or sharing',()=>{
 const {M,D,R,data,events,root}=setup(),options={now,records:[request(D)],careRecords:[]};
 R.needs('tiger',options);const before=[data.get(M.KEYS.records),data.get(D.KEYS.updates),data.get(D.KEYS.social)];
 const first=R.setCheckOffer('tiger',true,options),again=R.setCheckOffer('tiger',true,options);
 assert.equal(first.ok,true);assert.equal(again.offer.createdAt,first.offer.createdAt);assert.equal(JSON.parse(data.get(R.CHECK_OFFERS_KEY)).length,1);
 assert.equal(events.filter(x=>x==='mewlink-data-changed').length,1);
 assert.deepEqual([data.get(M.KEYS.records),data.get(D.KEYS.updates),data.get(D.KEYS.social)],before);assert.equal(R.needs('tiger',options).length,1);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/refinement-model.js'),'utf8'),root);
 assert.equal(root.MewLinkRefine.checkOffer('tiger',options).requestId,'request-tiger');
});

test('new source records require a new offer; withdrawing preserves other cats and viewers',()=>{
 const {D,R,data}=setup(),a=request(D),b=request(D,{id:'bubu-request',catId:'bubu'}),options={now,records:[a,b],careRecords:[]};
 R.setCheckOffer('tiger',true,options);R.setCheckOffer('bubu',true,options);R.setCheckOffer('tiger',true,{...options,viewer:'ravi'});
 assert.equal(JSON.parse(data.get(R.CHECK_OFFERS_KEY)).length,3);
 const changed={...options,records:[{...a,id:'new-request',occurredAt:new Date(now-1000).toISOString()},b]};
 assert.equal(R.checkOffer('tiger',changed),null);assert.equal(R.setCheckOffer('tiger',true,changed).offer.requestId,'new-request');
 assert.equal(JSON.parse(data.get(R.CHECK_OFFERS_KEY)).length,3);
 assert.equal(R.setCheckOffer('tiger',false,changed).ok,true);assert.equal(R.checkOffer('tiger',changed),null);
 assert(R.checkOffer('bubu',options));assert(R.checkOffer('tiger',{...options,viewer:'ravi'}));
});

test('missing, private, unmatched, future, expired and completed requests cannot be offered',()=>{
 const {D,R}=setup(),a=request(D);
 for(const records of [[],[{...a,visibility:'private'}],[{...a,identity:'unconfirmed'}],[{...a,occurredAt:new Date(now+1000).toISOString()}],[{...a,occurredAt:new Date(now-31*86400000).toISOString()}],[a,{...a,id:'done',occurredAt:new Date(now-1000).toISOString(),next:'',requestStatus:'completed',resolvesRequestId:a.id}]]){
  assert.equal(R.setCheckOffer('tiger',true,{now,records,careRecords:[]}).ok,false);
 }
 assert.equal(R.setCheckOffer('missing-cat',true,{now,records:[a],careRecords:[]}).ok,false);
});

test('offer storage failures never show a false offer or replace corrupted stored data',()=>{
 const x=setup(),options={now,records:[request(x.D)],careRecords:[]};x.block();assert.equal(x.R.setCheckOffer('tiger',true,options).ok,false);assert.equal(x.R.checkOffer('tiger',options),null);
 const y=setup();y.data.set(y.R.CHECK_OFFERS_KEY,'bad data');assert.equal(y.R.setCheckOffer('tiger',true,{...options,records:[request(y.D)]}).ok,false);assert.equal(y.data.get(y.R.CHECK_OFFERS_KEY),'bad data');
});

test('Cats Follow-up includes offered cats, retains baseline needs and preserves Handover membership',()=>{
 const {R,root}=setup();root.DCLogic=class{constructor(p){this.props=p;}setState(p){Object.assign(this.state,p);}forceUpdate(){}};
 const html=fs.readFileSync(path.join(__dirname,'../src/App.dc.html'),'utf8'),code=html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
 vm.runInContext(code+';this.TestApp=Component;',root);const c=new root.TestApp({only:'cats'});c.state.filter='Follow-up';
 assert(!c.renderVals().cats.some(x=>x.name==='Bubu'));assert(c.renderVals().cats.some(x=>x.name==='Tiger'));
 assert.equal(R.setCheckOffer('bubu',true).ok,true);assert(c.renderVals().cats.some(x=>x.name==='Bubu'&&x.follow==='You offered to check'));
 R.setCheckOffer('bubu',false);assert(!c.renderVals().cats.some(x=>x.name==='Bubu'));
 R.setCheckOffer('kopi',true);assert(c.renderVals().cats.some(x=>x.name==='Kopi'));c.state.filter='Handover';assert(c.renderVals().cats.some(x=>x.name==='Kopi'));
});
