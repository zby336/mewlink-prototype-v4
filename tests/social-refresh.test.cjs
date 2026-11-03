const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){
  const registry=new Map(),timers=new Map(),listeners=new Map();let nextTimer=0,reads=0;
  let posts=[{id:'first',author:'Ravi',initials:'RK',catIds:['kopi'],catName:'Kopi',at:'2026-11-03T08:00:00Z',text:'A saved update',liked:true,likeCount:5,comments:[]}];
  const scroller={scrollTop:0,clientHeight:300,scrollHeight:1000,overflowY:'auto',parentElement:null};
  const label={textContent:''},indicator={style:{},setAttribute(){},querySelector:()=>label},dialog={open:false,showModal(){this.open=true;},close(){this.open=false;}};
  const shadow={innerHTML:'',addEventListener(){},querySelector:s=>s==='dialog'?dialog:s==='.pull-indicator'?indicator:s==='[data-action="refresh"]'?{}:null};
  class Element{constructor(){this.isConnected=true;this.parentElement=scroller;}attachShadow(){return this.shadowRoot=shadow;}addEventListener(){}removeEventListener(){}}
  const root={MewLinkCare:{profileHref:id=>'#cat/'+id,allCats:()=>[{id:'kopi',name:'Kopi'}]},MewLinkData:{stamp:t=>t,posts:()=>{reads++;return posts;}},addEventListener:(t,fn)=>listeners.set(t,fn),removeEventListener:(t,fn)=>{if(listeners.get(t)===fn)listeners.delete(t);}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/knowledge-ui.js'),'utf8'),{window:root,HTMLElement:Element,customElements:{get:n=>registry.get(n),define:(n,c)=>registry.set(n,c)},getComputedStyle:n=>({overflowY:n.overflowY}),document:{scrollingElement:scroller},setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer;},clearTimeout:id=>timers.delete(id),Intl,Date,Map,Set});
  const Feed=registry.get('mew-social-feed'),feed=new Feed();feed.connectedCallback();
  return {feed,shadow,scroller,dialog,indicator,label,timers,listeners,reads:()=>reads,setPosts:p=>posts=p,runNext(){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}};
}
const target={closest:()=>null},point=(x,y)=>({clientX:x,clientY:y}),event=()=>({cancelable:true,preventDefault(){this.prevented=true;}});

test('pull refresh only claims a downward gesture at the top and refreshes once after release',()=>{
  const x=setup();x.scroller.scrollTop=50;x.feed.startPull(point(10,20),target);assert.equal(x.feed.gesture,undefined);
  x.scroller.scrollTop=0;x.feed.startPull(point(10,20),target);const e=event();x.feed.movePull(point(12,150),e);assert.equal(e.prevented,true);assert.equal(x.label.textContent,'Release to refresh');
  const before=x.reads();x.feed.endPull();assert.equal(x.feed.refreshing,true);assert.equal(x.reads(),before);assert.equal(x.feed.refreshFeed(),false);x.runNext();assert.equal(x.reads(),before+1);assert.equal(x.feed.refreshing,false);
});

test('short, horizontal, retracted and cancelled pulls never refresh posts',()=>{
  for(const finish of ['short','horizontal','retract','cancel']){
    const x=setup(),before=x.reads();x.feed.startPull(point(0,0),target);
    if(finish==='short')x.feed.movePull(point(0,60),event());
    if(finish==='horizontal')x.feed.movePull(point(160,30),event());
    if(finish==='retract'){x.feed.movePull(point(0,150),event());x.feed.movePull(point(0,3),event());}
    if(finish==='cancel'){x.feed.movePull(point(0,150),event());x.feed.cancelPull();}
    x.feed.endPull();assert.equal(x.reads(),before);assert.equal(x.timers.size,0);
  }
});

test('refresh rereads saved posts, retains comment drafts and does not invent or duplicate posts',()=>{
  const x=setup();x.feed.openComments.add('first');x.feed.commentDrafts.first='Keep this unfinished comment';
  x.setPosts([{id:'first',author:'Ravi',initials:'RK',catIds:['kopi'],catName:'Kopi',at:'2026-11-03T08:00:00Z',text:'Updated saved text',liked:true,likeCount:6,comments:[{author:'Aisha',text:'Existing comment',at:'2026-11-03T08:01:00Z'}]}]);
  x.feed.refreshFeed();x.runNext();assert.match(x.shadow.innerHTML,/Updated saved text/);assert.match(x.shadow.innerHTML,/Existing comment/);assert.match(x.shadow.innerHTML,/Keep this unfinished comment/);assert.match(x.shadow.innerHTML,/Like · 6/);assert.equal((x.shadow.innerHTML.match(/data-post="first"/g)||[]).length,1);
});

test('open share forms and interactive controls do not start pull refresh; leaving clears listeners and timers',()=>{
  const x=setup();x.dialog.open=true;assert.equal(x.feed.refreshFeed(),false);x.feed.startPull(point(0,0),target);assert.equal(x.feed.gesture,undefined);
  x.dialog.open=false;x.feed.startPull(point(0,0),{closest:()=>({})});assert.equal(x.feed.gesture,undefined);
  x.feed.refreshFeed();assert.equal(x.timers.size,1);x.feed.disconnectedCallback();assert.equal(x.timers.size,0);assert.equal(x.listeners.size,0);
});
