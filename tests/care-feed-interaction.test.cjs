const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){
 const registry=new Map(),timers=new Map(),listeners=new Map();let cycle=0,nextTimer=0,reads=0,pauses=0;
 const label={textContent:''},pull={style:{},setAttribute(){},querySelector:()=>label},refreshButton={disabled:false},dialog={close(){}},video={pause(){pauses++;}};
 const shadow={addEventListener(){},querySelector:s=>s==='.pull'?pull:s==='[data-action="refresh"]'?refreshButton:s==='dialog'?dialog:null,querySelectorAll:s=>s==='video'?[video]:[]};
 const scroller={scrollTop:0,overflowY:'auto',parentElement:null,addEventListener(){},removeEventListener(){}};
 class Element{constructor(){this.isConnected=true;this.parentElement=scroller;}attachShadow(){return this.shadowRoot=shadow;}}
 const root={MewLinkData:{},MewLinkCare:{},MewLinkCareFeed:{nextCycle:()=>cycle++,initScenarios(){},orderedPosts:()=>{reads++;return [];}},addEventListener:(t,fn)=>listeners.set(t,fn),removeEventListener:(t,fn)=>{if(listeners.get(t)===fn)listeners.delete(t);}};
 const location={hash:'#today',search:''};
 vm.runInNewContext(fs.readFileSync(require.resolve('../public/care-feed-ui.js'),'utf8'),{window:root,HTMLElement:Element,customElements:{get:n=>registry.get(n),define:(n,c)=>registry.set(n,c)},getComputedStyle:n=>({overflowY:n.overflowY}),document:{scrollingElement:scroller},location,URLSearchParams,setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer;},clearTimeout:id=>timers.delete(id),Date,Map,Set});
 const Home=registry.get('mew-care-home'),home=new Home();home.render=()=>root.MewLinkCareFeed.orderedPosts(home.refreshCycle);home.connectedCallback();
 return {home,root,shadow,scroller,label,timers,listeners,location,reads:()=>reads,pauses:()=>pauses,runNext(){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}};
}
const point=(x,y)=>({clientX:x,clientY:y}),target={closest:()=>null},event=()=>({cancelable:true,preventDefault(){this.prevented=true;}});

test('composer submits its complete multi-cat selection and rejects an empty selection',()=>{
 const x=setup();let submitted,closed=false,error='';x.home.close=()=>{closed=true;};x.home.sheetError=text=>{error=text;};x.root.MewLinkData.publishPost=draft=>{submitted=JSON.parse(JSON.stringify(draft));return {ok:true};};
 const submit={preventDefault(){},target:{dataset:{form:'compose'}}};x.home.submit(submit);assert.equal(submitted,undefined);assert.match(error,/at least one cat/);
 x.home.postDraft={catIds:['tiger','kopi'],text:'A shared moment.',media:[]};x.home.submit(submit);assert.deepEqual(submitted.catIds,['tiger','kopi']);assert.equal(closed,true);assert.equal(x.home.postDraft.catIds.length,0);assert.equal(x.home.status,'Posted to the circle');
});

test('an alert strip opens only its selected event and reporting keeps that event selected',()=>{
 const x=setup(),opened=[];x.root.MewLinkCareFeed.posts=()=>[];x.home.open=(mode,id)=>{opened.push([mode,id]);x.home.modal=mode;x.home.modalPost=id;};
 const click=(action,notice)=>x.home.click({target:{closest:()=>({dataset:{action,notice},closest:()=>null})}});
 click('notice','priority-vet-request');assert.deepEqual(opened[0],['notice','priority-vet-request']);click('report');assert.equal(x.home.reportDraft.alertId,'priority-vet-request');assert.equal(opened[1][0],'report');
});

test('the header refresh event works without a refresh button inside the feed and ignores duplicate clicks',()=>{
 const x=setup(),query=x.shadow.querySelector;x.shadow.querySelector=s=>s==='[data-action="refresh"]'?null:query(s);const before=x.reads();
 x.listeners.get('mewlink-refresh-care')();assert.equal(x.home.refreshing,true);x.listeners.get('mewlink-refresh-care')();assert.equal(x.timers.size,1);x.runNext();assert.equal(x.reads(),before+1);assert.equal(x.home.status,'Feed refreshed');
});
test('Care pull refresh requires the top edge and a released vertical threshold, and reads once',()=>{
 const x=setup();x.scroller.scrollTop=50;x.home.startPull(point(0,0),target);assert.equal(x.home.gesture,undefined);x.scroller.scrollTop=0;
 x.home.startPull(point(0,0),target);const e=event();x.home.movePull(point(2,140),e);assert.equal(e.prevented,true);assert.equal(x.label.textContent,'Release to refresh');const before=x.reads();x.home.endPull();assert.equal(x.home.refreshing,true);assert.equal(x.reads(),before);assert.equal(x.home.refreshFeed(),false);x.runNext();assert.equal(x.reads(),before+1);assert.equal(x.home.refreshCycle,1);
});
test('horizontal, short, cancelled and retracted Care pulls never refresh the feed',()=>{
 for(const kind of ['horizontal','short','cancel','retract']){const x=setup(),before=x.reads();x.home.startPull(point(0,0),target);if(kind==='horizontal')x.home.movePull(point(150,20),event());else x.home.movePull(point(1,kind==='short'?30:150),event());if(kind==='cancel')x.home.cancelPull();if(kind==='retract')x.home.movePull(point(1,2),event());x.home.endPull();assert.equal(x.reads(),before);assert.equal(x.timers.size,0);}
});
test('tapping the active Care tab refreshes and returns to the top, without swallowing other routes',()=>{
 const x=setup(),click=href=>({composedPath:()=>[{tagName:'A',getAttribute:()=>href}]});x.scroller.scrollTop=200;x.home.onCareClick(click('#cats'));assert.equal(x.home.refreshing,undefined);x.home.onCareClick(click('#today'));assert.equal(x.home.refreshing,true);assert.equal(x.scroller.scrollTop,0);x.runNext();assert.equal(x.home.refreshCycle,1);
});
test('forms/media controls block pull refresh; navigation clears timers listeners and playback',()=>{
 const x=setup();x.home.modal='compose';assert.equal(x.home.refreshFeed(),false);x.home.startPull(point(0,0),target);assert.equal(x.home.gesture,undefined);x.home.modal=null;x.home.startPull(point(0,0),{closest:()=>({tagName:'VIDEO'})});assert.equal(x.home.gesture,undefined);x.home.refreshFeed();assert(x.timers.size);x.home.disconnectedCallback();assert.equal(x.timers.size,0);assert.equal(x.listeners.size,0);assert(x.pauses()>0);
});
