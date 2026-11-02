"use strict";
// Story images: a 2 x 2 grid. Choice images: full-height A/B/C columns.
// Adjust rectangles here if your artwork has unequal panels or margins.
const PANEL_RECTS = [[0,0,.5,.5],[.5,0,1,.5],[0,.5,.5,1],[.5,.5,1,1]];
const CHOICE_RECTS = [[0,0,1/3,1],[1/3,0,2/3,1],[2/3,0,1,1]];
const SCENARIOS = [
 {title:"朋友爭執", comic:"friend-conflict.jpg", choices:"friend-conflict-choices.jpg", labels:["A｜指責","B｜冷處理","C｜說出感受"], feedback:["指責可能令爭執升級。可以改為說明自己的感受和希望。","需要冷靜時可以暫停，也可以告訴對方何時再談。","你選擇表達感受和希望，讓對方更容易理解你的需要。"], tip:"可以說：『你沒有等我時，我感到被忽略。下次可以先告訴我嗎？』"},
 {title:"交往界線", comic:"relationship-boundaries.jpg", choices:"relationship-boundaries-choices.jpg", labels:["A｜強硬拒絕","B｜默默忍耐","C｜設立界線"], feedback:["你有權拒絕不想要的接觸；若情況安全，也可以清楚說明自己的界線。","不舒服時不必勉強接受，可以拒絕並尋求支援。","清楚說出界線，能讓對方知道你的需要。"], tip:"可以說：『我不想這樣接觸，請保持一點距離。』若感到不安全，先離開並向可信任的人求助。"},
 {title:"親子功課", comic:"homework.jpg", choices:"homework-choices.jpg", labels:["A｜發脾氣","B｜逃避","C｜尋求協助"], feedback:["感到挫折時，可以先停一停，再說明哪裡不懂。","可以先休息一下，然後提出一個具體的求助問題。","你選擇說明困難並尋求協助，可以一起找出下一步。"], tip:"可以說：『這題我有點卡住了，可以和我一起把它拆成小步驟嗎？』"}
];
const $ = id => document.getElementById(id);
const cache = new Map();
let state = {index:0, stage:1, answers:[null,null,null]};
try {
 const saved=JSON.parse(localStorage.getItem("social-story-v1"));
 if(saved && Number.isInteger(saved.index) && saved.index>=0 && saved.index<3 && Number.isInteger(saved.stage) && saved.stage>=1 && saved.stage<=5 && Array.isArray(saved.answers) && saved.answers.length===3 && saved.answers.every(x=>x===null || (Number.isInteger(x)&&x>=0&&x<3))) {
  state=saved;
  if(state.stage>=4 && state.answers[state.index]===null) state.stage=3;
 }
} catch (_) {}
let revision=0;
function save(){try{localStorage.setItem("social-story-v1",JSON.stringify(state));}catch(_) {}}
function loadImage(filename){
 if(cache.has(filename)) return cache.get(filename);
 const promise = new Promise((resolve,reject)=>{
  const im=new Image();
  im.onload=()=>resolve(im);
  im.onerror=()=>{cache.delete(filename);reject(new Error(`找不到圖片：assets/${filename}\n請檢查檔名（包括大小寫），並把圖片放進 assets 資料夾。`));};
  im.src=new URL(`./assets/${filename}`,document.baseURI).href;
 });
 cache.set(filename,promise);return promise;
}
function crop(im,rect){
 const [l,t,r,b]=rect;
 const x=Math.round(l*im.naturalWidth),y=Math.round(t*im.naturalHeight);
 const w=Math.round(r*im.naturalWidth)-x,h=Math.round(b*im.naturalHeight)-y;
 const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
 canvas.getContext("2d").drawImage(im,x,y,w,h,0,0,w,h);
 return canvas.toDataURL("image/png");
}
function picture(src,alt){const im=document.createElement("img");im.src=src;im.alt=alt;return im;}
function openZoom(src,alt){$("zoomImage").src=src;$("zoomImage").alt=alt;$("zoom").showModal();}
async function render(){
 const token=++revision;save();
 const s=SCENARIOS[state.index],stage=state.stage;
 $("badge").textContent=`情境 ${state.index+1} / 3`;
 $("progress").value=state.index*5+stage;
 $("heading").textContent=`${s.title}｜${stage===3?"選擇回應":`第 ${stage<3?stage:stage-1} 格`}`;
 $("instruction").textContent=stage===3?"先看三張漫畫卡，再按對應卡下方的按鈕。":"閱讀這一格漫畫，再按下一步。";
 $("content").replaceChildren();$("status").textContent="正在載入圖片…";
 $("back").disabled=state.index===0&&stage===1;
 $("next").hidden=stage===3;
 $("next").disabled=true;
 $("next").textContent=stage===5?(state.index===2?"完成練習":"下一個情境"):"下一步";
 try {
  const im=await loadImage(stage===3?s.choices:s.comic);
  if(token!==revision)return;
  if(stage===3){
   const grid=document.createElement("div");grid.className="choices";
   CHOICE_RECTS.forEach((rect,n)=>{
    const card=document.createElement("article");card.className="card";
    card.append(picture(crop(im,rect),`${s.title}：選項 ${s.labels[n]}`));
    const btn=document.createElement("button");btn.type="button";btn.textContent=s.labels[n];
    btn.addEventListener("click",()=>{state.answers[state.index]=n;state.stage=4;render();});
    card.append(btn);grid.append(card);
   });$("content").append(grid);
  }else{
   const n=stage<3?stage-1:stage-2,src=crop(im,PANEL_RECTS[n]);
   const box=document.createElement("div");box.className="panel animate";
   box.append(picture(src,`${s.title}，第 ${n+1} 格`));
   const enlarge=document.createElement("button");enlarge.className="secondary";enlarge.textContent="放大這一格";enlarge.addEventListener("click",()=>openZoom(src,`${s.title}，第 ${n+1} 格`));
   box.append(enlarge);$("content").append(box);
   if(stage===4){
    const feedback=document.createElement("div");feedback.className="feedback";
    const selected=state.answers[state.index];
    const line=document.createElement("p");line.textContent=`你選了 ${s.labels[selected]}。${s.feedback[selected]}`;
    const tip=document.createElement("p");tip.textContent=s.tip;
    feedback.append(line,tip);$("content").append(feedback);
   }
  }
  $("status").textContent="";$("next").disabled=false;
 }catch(error){
  if(token!==revision)return;
  const note=document.createElement("div");note.className="error";note.textContent=error.message;
  const retry=document.createElement("button");retry.textContent="重新載入圖片";retry.addEventListener("click",render);
  $("content").append(note,retry);$("status").textContent="圖片載入失敗。";
 }
 $("view").focus({preventScroll:true});
}
$("next").addEventListener("click",()=>{
 if(state.stage===3)return;
 if(state.stage===5){
  if(state.index===2){
   if(!confirm("你已完成三個情境！要重新開始嗎？"))return;
   state={index:0,stage:1,answers:[null,null,null]};
  }else{state.index++;state.stage=1;}
 }else state.stage++;
 render();
});
$("back").addEventListener("click",()=>{
 if(state.stage>1)state.stage--;else if(state.index>0){state.index--;state.stage=5;}
 render();
});
$("restart").addEventListener("click",()=>{
 if(confirm("要清除進度並重新開始嗎？")){state={index:0,stage:1,answers:[null,null,null]};render();}
});
$("closeZoom").addEventListener("click",()=>$("zoom").close());
render();
