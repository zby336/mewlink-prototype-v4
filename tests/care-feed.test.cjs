const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(){
 const store=new Map(),events=[];let blocked=false;
 const root={console,Date,Intl,Math,Set,Map,Event,localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(blocked)throw Error('quota');store.set(k,v);},removeItem:k=>store.delete(k)},dispatchEvent:e=>events.push(e.type),crypto:{randomUUID:()=>require('node:crypto').randomUUID()}};
 root.globalThis=root;vm.createContext(root);for(const f of ['caregiver-model.js','care-knowledge.js','refinement-model.js','care-feed-model.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',f),'utf8'),root);
 return {M:root.MewLinkCare,D:root.MewLinkData,R:root.MewLinkRefine,F:root.MewLinkCareFeed,root,store,events,block:()=>blocked=true};
}
const now=Date.parse('2026-11-07T14:00:00+08:00');
const note=(D,extra={})=>({id:'request',catId:'tiger',identity:'confirmed',authorId:'aisha',circleId:D.CIRCLE,visibility:'circle',occurredAt:new Date(now-3600000).toISOString(),observed:'Small cut near one ear.',next:'Check the ear in better light.',...extra});

test('priority notifications exclude routine observations and missing feeding evidence',()=>{
 const {F,D}=setup(),records=[note(D),note(D,{id:'water',observed:'Water bowl nearly empty.',next:'Check and refill the water.'}),note(D,{id:'shy',observed:'Mochi stepped back.',next:'Give her space.'}),note(D,{id:'missing',observed:'No feeding record found.',next:''})];
 assert.equal(F.urgentItems({now,records}).length,0);
});
test('medical notifications require explicit help, preserve exact wording and reject negative requests',()=>{
 const {F,D}=setup(),r=note(D,{observed:'I need urgent veterinary help for Tiger; he would not put weight on his front paw.',next:'Coordinate help with the circle.'});
 const item=F.urgentItems({now,records:[r]})[0];assert.equal(item.text,r.observed);assert.equal(item.recordId,r.id);assert.equal(item.source.id,r.id);assert.equal(item.kind,'medical');
 assert.equal(F.urgentItems({now,records:[{...r,observed:'No urgent veterinary help is needed.',next:''}]}).length,0);
 assert.equal(F.urgentItems({now,records:[{...r,helpRequest:{kind:'medical',urgency:'urgent',status:'closed'}}]}).length,0);
});
test('only explicit primary-caregiver travel or moving requests in a dated active period enter notifications',()=>{
 const {F,D}=setup(),careEvent={type:'caregiver-away',role:'primary',reason:'travel',status:'open',from:new Date(now+86400000).toISOString(),until:new Date(now+8*86400000).toISOString()},r=note(D,{careEvent,observed:'I will be travelling. Please cover evening care.',next:'Coordinate feeding cover.'});
 const item=F.urgentItems({now,records:[r]})[0];assert.equal(item.kind,'cover');assert(item.period);assert.equal(item.text,r.observed);
 for(const changes of [{role:'visitor'},{status:'completed'},{until:new Date(now-1000).toISOString()},{from:'unknown'},{reason:'unspecified'}])assert.equal(F.urgentItems({now,records:[{...r,careEvent:{...careEvent,...changes}}]}).length,0);
});
test('priority notifications filter private foreign future unmatched and resolved records',()=>{
 const {F,D}=setup(),r=note(D,{helpRequest:{kind:'medical',urgency:'urgent',status:'open'}});
 for(const changes of [{visibility:'private'},{circleId:'other'},{identity:'unconfirmed'},{occurredAt:new Date(now+1000).toISOString()},{catId:'unknown'}])assert.equal(F.urgentItems({now,records:[{...r,...changes}]}).length,0);
 assert.equal(F.urgentItems({now,records:[r,{...note(D),id:'resolved',occurredAt:new Date(now-1000).toISOString(),requestStatus:'completed',resolvesRequestId:r.id}]}).length,0);
});
test('scenario examples seed once and are visible to profile/retrieval without rewriting saved care',()=>{
 const {F,D,M,store}=setup();D.demo();store.set(D.KEYS.updates,JSON.stringify([{id:'existing-private-note'}]));const before=store.get(D.KEYS.updates),care=store.get(M.KEYS.records);
 const seeded=F.initScenarios(now);assert.equal(seeded.length,2);assert(seeded.every(r=>r.source==='demo'&&r.scenario));const snapshot=store.get(F.KEYS.scenarios);F.initScenarios(now+86400000);assert.equal(store.get(F.KEYS.scenarios),snapshot);
 assert.equal(store.get(D.KEYS.updates),before);assert.equal(store.get(M.KEYS.records),care);
 assert(D.observations('biscuit',{now}).some(r=>r.id==='care-scenario-biscuit-vet'));assert(F.urgentItems({now}).some(n=>n.recordId==='care-scenario-kopi-cover'));
 assert(D.suggestions('biscuit',{now}).items.some(i=>i.sourceIds.includes('care-scenario-biscuit-vet')));
});
test('refresh changes presentation order while retaining the same posts comments and records',()=>{
 const {F,D,store}=setup();const before=JSON.stringify(D.updates()),a=F.orderedPosts(0),b=F.orderedPosts(1);assert(a.length>=6);assert.notEqual(a[0].id,b[0].id);assert.deepEqual(Array.from(a,p=>p.id).sort(),Array.from(b,p=>p.id).sort());assert.equal(JSON.stringify(D.updates()),before);
 assert.equal(D.addComment('care-feed-mochi','I will keep my distance.'),true);assert(F.posts().find(p=>p.id==='care-feed-mochi').comments.some(c=>c.text==='I will keep my distance.'));assert.equal(D.addComment('missing','Hello'),false);assert.equal(store.has(D.KEYS.updates),false);
});
test('bookmarks persist independently of care and public sharing and handle storage errors',()=>{
 const {F,D,store,block}=setup();const id=F.posts()[0].id,before=store.get(D.KEYS.social);assert.equal(F.toggleSaved(id).saved,true);assert.equal(F.isSaved(id),true);assert.equal(store.get(D.KEYS.social),before);assert.equal(F.toggleSaved(id).saved,false);assert.equal(F.toggleSaved('unknown').ok,false);block();assert.equal(F.toggleSaved(id).ok,false);assert.equal(F.isSaved(id),false);
});

test('Saved posts retrieves existing bookmarks, filters unavailable IDs and removes unsaved posts without changing care',()=>{
 const {F,D,M,store}=setup();const list=F.posts(),ids=[list[0].id,list[1].id],care=JSON.stringify(M.allRecords()),updates=JSON.stringify(D.updates()),social=store.get(D.KEYS.social);
 assert.equal(F.savedPosts().length,0);
 store.set(F.KEYS.saved,JSON.stringify([...ids,'unavailable-old-post']));
 assert.deepEqual(Array.from(F.savedPosts(),p=>p.id),ids);assert(F.savedPosts().every(p=>p.saved));
 assert.equal(F.toggleSaved(ids[0]).saved,false);assert.deepEqual(Array.from(F.savedPosts(),p=>p.id),[ids[1]]);
 assert.equal(F.toggleSaved(ids[1]).saved,false);assert.equal(F.savedPosts().length,0);
 assert.equal(JSON.stringify(M.allRecords()),care);assert.equal(JSON.stringify(D.updates()),updates);assert.equal(store.get(D.KEYS.social),social);
});
test('image albums video and text posts publish only through explicit sharing without confirming feeding',()=>{
 const {D,F}=setup(),updatesBefore=JSON.stringify(D.updates());
 const album=D.publishPost({catId:'tiger',text:'Two photos from my visit.',media:[{type:'image',src:'data:image/png;base64,AAAA'},{type:'image',src:'data:image/png;base64,BBBB'}]});assert.equal(album.ok,true);assert.equal(F.posts().find(p=>p.id===album.post.id).media.length,2);
 const video=D.publishPost({catId:'tiger',text:'',media:[{type:'video',src:'data:video/mp4;base64,AAAA'}]});assert.equal(video.ok,true);assert.equal(F.posts().find(p=>p.id===video.post.id).media[0].type,'video');
 assert.equal(D.publishPost({catId:'tiger',text:'Text only'}).ok,true);assert.equal(D.publishPost({catId:'tiger',text:'',media:[]}).ok,false);assert.equal(D.publishPost({catId:'tiger',text:'x',media:[{type:'image',src:'javascript:alert(1)'}]}).ok,false);assert.equal(D.publishPost({catId:'tiger',text:'x',media:[{type:'video',src:'data:video/mp4;base64,AAAA'},{type:'image',src:'data:image/png;base64,AAAA'}]}).ok,false);assert.equal(JSON.stringify(D.updates()),updatesBefore);
});
test('a saved private care note is never automatically published in the Care feed',()=>{
 const {D,F}=setup();D.beginDraft({catId:'tiger'});D.saveDraft({observed:'An unshared care note.',who:'yes'});const result=D.saveUpdate(D.loadDraft());assert.equal(result.ok,true);assert(!F.posts().some(p=>p.recordId===result.record.id));
 const url=F.shareUrl(F.posts()[0].id,'https://mewlink-experiments.vercel.app');assert.match(url,/\?post=.+#today$/);assert.equal(F.shareUrl('not-a-post','https://x'),null);
});
test('priority report selection accepts only current sourced notifications',()=>{
 const {F,D,R}=setup(),r=note(D,{helpRequest:{kind:'medical',urgency:'urgent',status:'open'}}),options={now,records:[r]},n=F.urgentItems(options)[0];const result=R.reportAlert({alertId:n.id,message:'Please verify the date.'},options);assert.equal(result.ok,true);assert.equal(result.report.recordId,r.id);assert.equal(R.reportAlert({alertId:'priority-made-up',message:'test'},options).ok,false);
});

test('multi-cat posts retain all unique selected cats and their actual zones without saving care',()=>{
 const {F,D,M,store}=setup(),care=JSON.stringify(M.allRecords()),updates=JSON.stringify(D.updates());
 const r=D.publishPost({catIds:['tiger','kopi','tiger'],text:'A quiet visit with both cats.'});assert.equal(r.ok,true);assert.deepEqual(Array.from(r.post.catIds),['tiger','kopi']);assert.equal(r.post.catName,'Tiger & Kopi');
 assert.deepEqual(Array.from(F.postZones(r.post)),['Zone A','Zone B']);const social=store.get(D.KEYS.social);
 for(const catIds of [['unknown'],['tiger','unknown'],'tiger'])assert.equal(D.publishPost({catIds,text:'Wrong cats'}).ok,false);
 assert.equal(store.get(D.KEYS.social),social);assert.equal(JSON.stringify(M.allRecords()),care);assert.equal(JSON.stringify(D.updates()),updates);
});

test('multi-cat selection cannot override the saved record identity when sharing a care note',()=>{
 for(const who of ['yes','unsure']){const {D}=setup();D.beginDraft({catId:'tiger'});D.saveDraft({who,observed:'A saved visit note.'});const saved=D.saveUpdate(D.loadDraft());assert.equal(saved.ok,true);const shared=D.publishPost({recordId:saved.record.id,catIds:['kopi','milo']});assert.equal(shared.ok,true);assert.deepEqual(Array.from(shared.post.catIds),who==='yes'?['tiger']:[]);}
});

test('likes work for original, added-example and newly published posts without changing care or bookmarks',()=>{
 const {F,D,M,store}=setup();const published=D.publishPost({catIds:['tiger','kopi'],text:'A circle moment.'}).post;F.toggleSaved(published.id);
 const care=JSON.stringify(M.allRecords()),updates=JSON.stringify(D.updates()),saved=store.get(F.KEYS.saved);
 for(const id of ['demo-post-ravi','care-feed-mochi',published.id]){const before=F.posts().find(p=>p.id===id).likeCount;assert.equal(D.toggleLike(id),true);let p=F.posts().find(p=>p.id===id);assert.equal(p.liked,true);assert.equal(p.likeCount,before+1);assert.equal(D.toggleLike(id),true);assert.equal(F.posts().find(p=>p.id===id).likeCount,before);}
 assert.equal(JSON.stringify(M.allRecords()),care);assert.equal(JSON.stringify(D.updates()),updates);assert.equal(store.get(F.KEYS.saved),saved);
});

test('the compact urgent summary only describes currently qualified requests',()=>{
 const {F}=setup();F.initScenarios(now);const items=F.urgentItems({now}),summary=F.urgentSummary(items);assert.match(summary,/Biscuit: Vet help/);assert.match(summary,/Kopi: Care cover/);assert(!summary.includes('Tiger'));assert(summary.length<80);assert.equal(F.urgentSummary([]),'');
});

test('individual care alerts rank veterinary requests before cover and nearer cover periods first',()=>{
 const {F,D}=setup(),iso=value=>new Date(value).toISOString();
 const medical=(id,ago)=>note(D,{id,occurredAt:iso(now-ago),helpRequest:{kind:'medical',urgency:'urgent',status:'open'}});
 const cover=(id,start,ago)=>note(D,{id,occurredAt:iso(now-ago),observed:'I am the primary caregiver and need care cover while travelling.',careEvent:{type:'caregiver-away',role:'primary',reason:'travel',status:'open',from:iso(now+start),until:iso(now+5*86400000)}});
 const records=[cover('later-cover',86400000,1000),medical('older-vet',2*86400000),cover('ongoing-cover',-86400000,3000),medical('recent-vet',86400000)],snapshot=JSON.stringify(records);
 const rows=F.urgentItems({now,records});assert.deepEqual(Array.from(rows,r=>r.recordId),['recent-vet','older-vet','ongoing-cover','later-cover']);assert.equal(JSON.stringify(records),snapshot);assert.equal(rows[2].text,records[2].observed);
});
