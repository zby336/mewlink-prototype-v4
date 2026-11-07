/* Care home presentation. Scenario fixtures stay separate from saved care. */
(function(root){
  'use strict';
  const D=root.MewLinkData,M=root.MewLinkCare;
  const KEYS={scenarios:'mewlink-care-home-scenarios-v1',saved:'mewlink-saved-posts-v1'};
  const read=(key,fallback)=>D.read(key,fallback);
  const emit=()=>root.dispatchEvent?.(new Event('mewlink-data-changed'));
  const date=t=>new Intl.DateTimeFormat('en-SG',{timeZone:'Asia/Singapore',day:'numeric',month:'short'}).format(new Date(t));
  let cycle=0;
  function initScenarios(now=Date.now()){
    if(root.localStorage.getItem(KEYS.scenarios)!==null)return scenarioRecords();
    const from=new Date((M.sgDay(now)+2)*M.DAY-8*3600000).toISOString(),until=new Date((M.sgDay(now)+9)*M.DAY-8*3600000-1).toISOString();
    const row=(id,catId,hours,observed,next,extra)=>({id,catId,authorId:'ravi',occurredAt:new Date(now-hours*3600000).toISOString(),createdAt:new Date(now-hours*3600000).toISOString(),observed,next,uncertain:'',identity:'confirmed',circleId:D.CIRCLE,visibility:'circle',source:'demo',scenario:true,...extra});
    const rows=[
      row('care-scenario-kopi-cover','kopi',3,'I am Kopi’s primary caregiver and will be travelling from '+date(from)+' to '+date(until)+'. I need someone to cover his evening care in Zone B.','Coordinate evening feeding and fresh-water cover from '+date(from)+' to '+date(until)+'.',{careEvent:{type:'caregiver-away',role:'primary',reason:'travel',from,until,status:'open'}}),
      row('care-scenario-biscuit-vet','biscuit',1,'Biscuit would not put weight on his front left paw during my visit. I need help arranging a veterinary assessment.','Help arrange a veterinary assessment; share an update after contacting the care circle.',{uncertain:'The cause is unknown; this is a caregiver observation.',helpRequest:{kind:'medical',urgency:'urgent',status:'open'}})
    ];
    try{root.localStorage.setItem(KEYS.scenarios,JSON.stringify(rows));return rows;}catch(_){return [];}
  }
  function scenarioRecords(){const a=read(KEYS.scenarios,[]);return Array.isArray(a)?a.filter(r=>r&&r.source==='demo'&&r.scenario===true):[];}
  function urgentItems(options={}){
    const now=options.now??Date.now(),all=options.records||M.allCats().flatMap(c=>D.observations(c.id,{now,viewer:options.viewer}));
    const visible=all.filter(r=>r&&r.identity==='confirmed'&&D.accessible(r,options.viewer)&&M.allCats().some(c=>c.id===r.catId)&&Number.isFinite(Date.parse(r.occurredAt))&&Date.parse(r.occurredAt)<=now);
    const output=[];
    for(const r of visible){
      if(visible.some(n=>Date.parse(n.occurredAt)>Date.parse(r.occurredAt)&&n.requestStatus==='completed'&&(n.resolvesRequestId===r.id||n.resolvedRequestIds?.includes(r.id))))continue;
      const event=r.careEvent,help=r.helpRequest,text=[r.observed,r.next].join(' ');
      const away=event?.type==='caregiver-away'&&event.role==='primary'&&['travel','moving','relocation'].includes(event.reason)&&event.status==='open'&&Number.isFinite(Date.parse(event.from))&&Number.isFinite(Date.parse(event.until))&&Date.parse(event.from)<=now+7*M.DAY&&Date.parse(event.until)>=now&&Date.parse(event.until)>Date.parse(event.from);
      const explicitMedical=help?.kind==='medical'&&help.urgency==='urgent'&&help.status==='open';
      // Require a request for veterinary help, not an inferred diagnosis or a mild observation.
      const writtenMedical=!help&&/\b(?:need(?:s)?|request(?:ing|ed)?|urgent)\b[^.!?\n]{0,70}\b(?:vet(?:erinary)?|medical)\b[^.!?\n]{0,40}\b(?:help|assessment|assistance|care|support)\b/i.test(text)&&!/\b(?:no|not|without)\b[^.!?\n]{0,35}\b(?:vet|medical|urgent)\b/i.test(text);
      const medical=(explicitMedical||writtenMedical)&&M.daysSince(r.occurredAt,now)<=30;
      if(!away&&!medical)continue;
      const cat=D.cat(r.catId),kind=medical?'medical':'cover';
      output.push({id:'priority-'+r.id,recordId:r.id,catIds:[r.catId],catName:cat.name,kind,priority:medical?0:1,neededFrom:away?event.from:null,label:kind==='cover'?'Care cover needed':'Vet assistance requested',title:cat.name+(kind==='cover'?' needs care cover':' needs veterinary support'),text:r.observed,action:r.next||'Contact the care circle to coordinate help.',author:D.author(r.authorId),occurredAt:r.occurredAt,period:away?date(event.from)+' – '+date(event.until):'',source:D.sourceFor(r),scenario:r.scenario===true});
    }
    return output.sort((a,b)=>a.priority-b.priority||(a.kind==='cover'&&b.kind==='cover'?Date.parse(a.neededFrom)-Date.parse(b.neededFrom):0)||Date.parse(b.occurredAt)-Date.parse(a.occurredAt)||a.id.localeCompare(b.id));
  }
  function demoPosts(){
    const rows=D.demo().observations;
    const definitions=[
      ['pepper','Fresh water, one slow blink.','Pepper’s bowl was nearly empty on the last round. Next visit: check and refill it, then leave him to enjoy the quiet.','photo'],
      ['mochi','A little distance is okay.','Mochi stepped back when I approached. Next time I’ll wait quietly and let her make the first move.','text'],
      ['tiger','A familiar face, a quieter hello.','Tiger let me come fairly close on the last visit. I kept the visit calm and left him plenty of space.','album'],
      ['bubu','Weekend company for Bubu.','An extra pair of hands would help with weekend rounds. Open Bubu’s profile if you’d like to lend a hand.','photo'],
      ['luna','Slow visits, small steps.','Luna came a little closer after I waited quietly. No rushing this friendship.','text']
    ];
    return definitions.map(([id,title,text,format])=>{
      const c=D.cat(id),r=rows.find(r=>r.catId===id&&r.source==='demo');if(!r||!c)return null;
      const media=format==='text'?[]:[{type:'image',src:M.profilePhoto(c),alt:c.name}];
      if(format==='album')media.push({type:'image',src:'https://images.unsplash.com/photo-1675504661658-33940d979a6a?w=720&h=720&fit=crop&q=75&auto=format',alt:'Tiger in the existing photo diary'});
      return {id:'care-feed-'+id,author:D.author(r.authorId),initials:D.author(r.authorId)==='Anonymous caregiver'?'CC':M.PEOPLE[r.authorId]?.initials||'CC',catIds:[id],catName:c.name,at:r.occurredAt,title,text,media,source:'demo',sourceRecordId:r.id};
    }).filter(Boolean);
  }
  function mediaFor(p){
    const safe=m=>m&&['image','video'].includes(m.type)&&typeof m.src==='string'&&(/^(?:https?:|blob:)/i.test(m.src)||/^data:(?:image|video)\//i.test(m.src));
    const items=Array.isArray(p.media)?p.media.filter(safe).slice(0,5):[];
    return items.length?items:p.photo?[{type:'image',src:p.photo,alt:p.catName||'Cat update'}]:[];
  }
  function posts(){
    const social=D.social(),unique=new Map();
    for(const p of [...D.posts(),...demoPosts()]){
      const catIds=(p.catIds||[]).filter(id=>D.cat(id));
      unique.set(p.id,{...p,catIds,media:mediaFor(p),liked:!!social.likes[p.id],likeCount:(Number(p.likes)||0)+(social.likes[p.id]?1:0),comments:social.comments[p.id]||p.comments||[],saved:isSaved(p.id)});
    }
    return [...unique.values()].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||a.id.localeCompare(b.id));
  }
  function orderedPosts(refreshCycle=0){
    const list=posts();if(!list.length)return list;
    const offset=((refreshCycle%list.length)+list.length)%list.length;
    return [...list.slice(offset),...list.slice(0,offset)];
  }
  function nextCycle(){return cycle++;}
  function savedPosts(){return posts().filter(p=>p.saved);}
  function postZones(p){return [...new Set((p.catIds||[]).map(id=>D.cat(id)?.zone).filter(Boolean))];}
  function urgentSummary(items=urgentItems()){return items.slice(0,2).map(n=>n.catName+': '+(n.kind==='cover'?'Care cover':'Vet help')).join(' · ')+(items.length>2?' · +'+(items.length-2):'');}
  function hasPost(id){return posts().some(p=>p.id===id);}
  function isSaved(id){const a=read(KEYS.saved,[]);return Array.isArray(a)&&a.includes(id);}
  function toggleSaved(id){
    if(!hasPost(id))return {ok:false,error:'This post is no longer available.'};
    const a=read(KEYS.saved,[]);if(!Array.isArray(a))return {ok:false,error:'Could not read saved posts.'};
    const saved=!a.includes(id),next=saved?[...a,id]:a.filter(x=>x!==id);
    try{root.localStorage.setItem(KEYS.saved,JSON.stringify(next));emit();return {ok:true,saved};}catch(_){return {ok:false,error:'Could not save this post. Please try again.'};}
  }
  function shareUrl(id,origin){return hasPost(id)?origin+'/?post='+encodeURIComponent(id)+'#today':null;}
  root.MewLinkCareFeed={KEYS,initScenarios,scenarioRecords,urgentItems,urgentSummary,demoPosts,mediaFor,postZones,posts,orderedPosts,nextCycle,savedPosts,hasPost,isSaved,toggleSaved,shareUrl};
})(typeof window!=='undefined'?window:globalThis);
