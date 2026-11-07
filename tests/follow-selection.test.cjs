const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(){
 const data=new Map(),session=new Map();let blocked=false;
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(blocked)throw Error('quota');data.set(k,v);},removeItem:k=>data.delete(k)};
 const root={console,Date,Intl,Math,Set,Map,Event,localStorage:storage,sessionStorage:{getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)},location:{hash:'#addcat'},dispatchEvent(){},addEventListener(){},removeEventListener(){},React:{createElement:()=>({})},crypto:{randomUUID:()=>require('node:crypto').randomUUID()}};
 root.window=root;root.globalThis=root;root.DCLogic=class{constructor(p){this.props=p||{};}setState(p){Object.assign(this.state,typeof p==='function'?p(this.state):p);}forceUpdate(){}};vm.createContext(root);
 for(const f of ['caregiver-model.js','care-knowledge.js','refinement-model.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',f),'utf8'),root);
 const component=file=>{const html=fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),code=html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];return vm.runInContext('(function(){'+code+';return Component;})()',root);};
 return {M:root.MewLinkCare,D:root.MewLinkData,R:root.MewLinkRefine,data,session,component,block:()=>blocked=true};
}
test('following deduplicates IDs and preserves legacy names without creating care or social records',()=>{
 const {M,D,R,data}=setup();M.allRecords();D.demo();data.set('mewlink-joined-cats',JSON.stringify(['Kopi','unknown name']));
 const before=[data.get(M.KEYS.records),data.get(D.KEYS.updates),data.get(D.KEYS.social),data.get(R.CHECK_OFFERS_KEY)];
 assert.deepEqual(Array.from(R.followedCatIds()),['kopi']);assert.equal(R.addFollowedCats(['pepper','pepper']).ok,true);assert.equal(R.addFollowedCats(['bubu']).ok,true);
 assert.deepEqual(Array.from(R.followedCatIds()).sort(),['bubu','kopi','pepper']);assert.equal(data.get('mewlink-joined-cats'),JSON.stringify(['Kopi','unknown name']));
 assert.deepEqual([data.get(M.KEYS.records),data.get(D.KEYS.updates),data.get(D.KEYS.social),data.get(R.CHECK_OFFERS_KEY)],before);assert.equal(R.addFollowedCats([]).ok,false);assert.equal(R.addFollowedCats(['not-a-cat']).ok,false);
});
test('picker uses the current zone catalogue and selection opens the actual Cats Follow-up list',()=>{
 const {R,component,session}=setup(),Picker=component('AddCat.dc.html'),picker=new Picker();picker.renderVals().pickJoin();let view=picker.renderVals();
 assert.equal(view.noPicked,true);assert(view.areaCats.some(c=>c.id==='pepper'));assert(!view.areaCats.some(c=>c.id==='milo'));
 view.areaCats.find(c=>c.id==='pepper').toggle();view=picker.renderVals();view.zoneTabs.find(z=>z.label==='Zone C').pick();picker.renderVals().areaCats.find(c=>c.id==='bubu').toggle();
 picker.renderVals().joinDone();view=picker.renderVals();assert.equal(view.isDone,true);assert.match(view.doneTitle,/Follow-up/);assert.doesNotMatch(view.doneTitle,/feeding/i);assert.equal(view.doneHref,'#cats');view.doneGo();assert.equal(session.get('mewlink-open-follow-up'),'1');
 const App=component('App.dc.html'),app=new App({only:'cats'});assert.equal(app.state.filter,'Follow-up');assert.equal(session.has('mewlink-open-follow-up'),false);
 const cats=app.renderVals().cats;assert(cats.some(c=>c.name==='Pepper'));assert(cats.some(c=>c.name==='Bubu'));assert(cats.some(c=>c.name==='Tiger'));assert.equal(R.checkOffer('bubu'),null);
});
test('failed follow storage keeps the picker selection and never displays success',()=>{
 const {R,component,block}=setup(),Picker=component('AddCat.dc.html'),picker=new Picker();picker.renderVals().pickJoin();picker.renderVals().areaCats.find(c=>c.id==='pepper').toggle();block();picker.renderVals().joinDone();const v=picker.renderVals();assert.equal(v.isPick,true);assert.equal(v.isDone,false);assert.equal(v.hasJoinError,true);assert.equal(picker.state.picked[0],'pepper');assert.equal(R.followedCatIds().length,0);
});
test('manual follows coexist with offers and preserve Handover membership',()=>{
 const {R,component}=setup();assert.equal(R.setCheckOffer('kopi',true).ok,true);R.addFollowedCats(['milo']);const App=component('App.dc.html'),app=new App({only:'cats'});app.state.filter='Follow-up';let cats=app.renderVals().cats;assert(cats.some(c=>c.name==='Milo'));assert(cats.some(c=>c.name==='Kopi'));app.state.filter='Handover';assert(app.renderVals().cats.some(c=>c.name==='Kopi'));
});
