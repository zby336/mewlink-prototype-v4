const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){
 const data=new Map(),events=[];let blocked=false;
 const root={localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(blocked)throw Error('quota');data.set(k,v);},removeItem:k=>{if(blocked)throw Error('quota');data.delete(k);}},dispatchEvent:e=>events.push(e.type)};root.globalThis=root;
 vm.runInNewContext(fs.readFileSync(require.resolve('../public/user-avatar.js'),'utf8'),{globalThis:root,Event,Date});
 return {A:root.MewLinkAvatar,data,events,block:()=>blocked=true};
}
const photo='data:image/jpeg;base64,/9j/2Q==';

test('avatar save, replace and removal persist independently from care and other preferences',()=>{
 const {A,data,events}=setup();data.set('mewlink-care-records-v1','existing care');data.set('mewlink-care-preferences-v1','private identity preference');
 assert.equal(A.read(),'');assert.equal(A.save(photo).ok,true);assert.equal(A.read(),photo);
 const replacement='data:image/jpeg;base64,/9j/AA==';assert.equal(A.save(replacement).ok,true);assert.equal(A.read(),replacement);
 assert.equal(JSON.parse(data.get(A.KEY)).src,replacement);assert.equal(A.save('').ok,true);assert.equal(A.read(),'');assert(!data.has(A.KEY));
 assert.equal(data.get('mewlink-care-records-v1'),'existing care');assert.equal(data.get('mewlink-care-preferences-v1'),'private identity preference');assert.equal(events.length,3);
});

test('invalid, oversized or failed avatar writes retain the previous photo',()=>{
 const {A,data,block}=setup();A.save(photo);for(const src of ['https://example.com/avatar.jpg','data:image/svg+xml,<svg/>','data:image/jpeg;base64,'+'A'.repeat(500001),null]){assert.equal(A.save(src).ok,false);assert.equal(A.read(),photo);}
 block();assert.equal(A.save('data:image/jpeg;base64,/9j/AA==').ok,false);assert.equal(A.save('').ok,false);assert.equal(A.read(),photo);
 data.set(A.KEY,'corrupt json');assert.equal(A.read(),'');
});

test('image preparation keeps a centred square without upscaling and rejects unsupported file input',async()=>{
 const {A}=setup();assert.deepEqual(JSON.parse(JSON.stringify(A.cropSquare(1280,720))),{sx:280,sy:0,side:720,size:512});assert.equal(A.cropSquare(600,900).sy,150);assert.equal(A.cropSquare(200,300).size,200);
 await assert.rejects(A.prepare({type:'text/plain',size:20}),/image file/);await assert.rejects(A.prepare({type:'image/jpeg',size:11*1024*1024}),/10 MB/);
});
