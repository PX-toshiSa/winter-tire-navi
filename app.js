const API = "https://api.open-meteo.com/v1/forecast";
const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const KEY = "winterTireNaviRegionsV1";
const INSTALLED_KEY = "winterTireNaviInstalledV1";
const toyama = {id:"toyama-city",name:"富山市",admin:"富山県",lat:36.6953,lon:137.2113};
let regions = load(KEY, [toyama]);
let installed = load(INSTALLED_KEY, []);
let selectedId = regions[0]?.id || toyama.id;
let results = {};

function load(key, fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}}
function save(){localStorage.setItem(KEY,JSON.stringify(regions));localStorage.setItem(INSTALLED_KEY,JSON.stringify(installed))}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function weather(code){
 const map={0:["快晴","☀️"],1:["晴れ","🌤️"],2:["一部くもり","⛅"],3:["くもり","☁️"],45:["霧","🌫️"],48:["着氷性の霧","🌫️"],51:["弱い霧雨","🌦️"],53:["霧雨","🌦️"],55:["強い霧雨","🌧️"],56:["着氷性の霧雨","🌧️"],57:["強い着氷性の霧雨","🌧️"],61:["弱い雨","🌧️"],63:["雨","🌧️"],65:["強い雨","🌧️"],66:["凍る雨","🌧️"],67:["強い凍る雨","🌧️"],71:["弱い雪","🌨️"],73:["雪","❄️"],75:["大雪","❄️"],77:["雪あられ","🌨️"],80:["にわか雨","🌦️"],81:["強いにわか雨","🌧️"],82:["激しいにわか雨","🌧️"],85:["にわか雪","🌨️"],86:["強いにわか雪","❄️"],95:["雷雨","⛈️"],96:["ひょうを伴う雷雨","⛈️"],99:["激しい雷雨","⛈️"]};
 return map[code] || ["天気情報","🌡️"];
}
function adviceFor(d){
 const lows=d.temperature_2m_min||[], snow=d.snowfall_sum||[], probs=d.precipitation_probability_max||[], codes=d.weather_code||[];
 const below=lows.some(x=>x<0);
 const hasSnow=snow.some(x=>x>0)||codes.some(c=>[56,57,66,67,71,73,75,77,85,86].includes(c));
 const coldWet=lows.some((x,i)=>x<=2&&(probs[i]||0)>=40);
 if(hasSnow&&(below||coldWet)) return 4;
 if(below||hasSnow) return 3;
 if(lows.some(x=>x<=3)) return 2;
 return 1;
}
const adviceInfo={
 1:{title:"通常",icon:"✓",text:"今後7日間は強い冷え込みや降雪の予報はありません。引き続き週間予報を確認してください。"},
 2:{title:"交換準備",icon:"◷",text:"最低気温が3℃以下になる予報です。混雑する前に交換日を検討しましょう。"},
 3:{title:"交換推奨",icon:"❄",text:"氷点下または降雪の予報があります。冬用タイヤへの交換をおすすめします。"},
 4:{title:"早めに交換",icon:"!",text:"降雪と氷点下などの条件が重なる予報です。未交換の場合は早めに交換してください。"}
};
function fmtDate(date){const d=new Date(date+"T12:00:00");return new Intl.DateTimeFormat("ja-JP",{weekday:"short",month:"numeric",day:"numeric"}).format(d)}
async function getForecast(region){
 const url=new URL(API);url.search=new URLSearchParams({
  latitude:region.lat,longitude:region.lon,daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,snowfall_sum",forecast_days:"7",timezone:"auto"
 }).toString();
 const r=await fetch(url);if(!r.ok)throw new Error("予報APIエラー");return await r.json();
}
async function refreshAll(){
 const btn=document.getElementById("refreshBtn");btn.textContent="…";
 document.getElementById("detailPanel").innerHTML='<div class="loading">週間天気予報を取得しています…</div>';
 let failures=[];
 for(const region of regions){
  try{const data=await getForecast(region);results[region.id]={data,level:adviceFor(data.daily),updated:new Date()};}
  catch(e){failures.push(region.name);}
 }
 render();
 btn.textContent="↻";
 if(failures.length)toast(failures.join("、")+"の予報を取得できませんでした");
}
function renderRegions(){
 const el=document.getElementById("regionList");
 el.innerHTML=regions.map(r=>{
  const active=r.id===selectedId, level=results[r.id]?.level, label=level?adviceInfo[level].title:"未取得";
  return `<button class="region-chip ${active?"active":""}" data-id="${esc(r.id)}">${esc(r.name)} · ${label}</button>`;
 }).join("");
 el.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{selectedId=b.dataset.id;render()}));
}
function render(){
 renderRegions();
 const region=regions.find(r=>r.id===selectedId);
 const result=results[selectedId];
 const panel=document.getElementById("detailPanel");
 if(!region){panel.innerHTML='<div class="loading">地域を登録してください。</div>';return}
 if(!result){panel.innerHTML=`<div class="detail-head"><h2>${esc(region.name)}</h2></div><div class="loading">予報データがありません。更新してください。</div>`;return}
 const {data,level,updated}=result, d=data.daily, info=adviceInfo[level], isInstalled=installed.includes(region.id);
 const lows=d.temperature_2m_min||[], highs=d.temperature_2m_max||[], snow=d.snowfall_sum||[], codes=d.weather_code||[];
 const min=Math.min(...lows), snowDays=snow.filter(x=>x>0).length;
 const rows=d.time.map((date,i)=>{const w=weather(codes[i]);return `<div class="forecast-row"><b>${fmtDate(date)}</b><span class="weather-icon">${w[1]}</span><span><span>${w[0]}</span><br><span class="condition">降雪 ${Number(snow[i]||0).toFixed(1)} cm</span></span><b>${Math.round(highs[i])}°</b><b class="low ${lows[i]<0?"below-zero":""}">${Math.round(lows[i])}°</b></div>`}).join("");
 panel.innerHTML=`
  <div class="detail-head"><h2>${esc(region.admin||"登録地域")} ${esc(region.name)}</h2><span class="updated">更新 ${updated.toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})}</span></div>
  <div class="advice level-${level}">
   <div class="advice-top"><span class="advice-icon">${info.icon}</span><div class="advice-title">${isInstalled?"冬用タイヤ装着済み":info.title}</div></div>
   <p>${isInstalled?"交換済みとして登録されています。":info.text}</p>
  </div>
  <div class="metrics">
   <div class="metric"><span>週間最低気温</span><b>${Math.round(min)}℃</b></div>
   <div class="metric"><span>氷点下の日</span><b>${lows.filter(x=>x<0).length}日</b></div>
   <div class="metric"><span>降雪予報の日</span><b>${snowDays}日</b></div>
  </div>
  <div class="forecast-title">これから7日間の予報</div>
  ${rows}
  <div class="forecast-legend">最高気温　　最低気温</div>
  <div class="status-row"><span>この地域で冬用タイヤに交換済み</span><button id="installedToggle" class="switch ${isInstalled?"on":""}" aria-label="交換済み切り替え"></button></div>
  <div class="region-tools">${regions.length>1?`<button class="remove" id="removeRegion">この地域を削除</button>`:""}</div>`;
 document.getElementById("installedToggle").addEventListener("click",()=>{
  installed=isInstalled?installed.filter(x=>x!==region.id):[...installed,region.id];save();render();
 });
 const rm=document.getElementById("removeRegion");if(rm)rm.addEventListener("click",()=>{if(confirm(`${region.name}を削除しますか？`)){regions=regions.filter(x=>x.id!==region.id);delete results[region.id];installed=installed.filter(x=>x!==region.id);selectedId=regions[0].id;save();render()}});
}
document.getElementById("refreshBtn").addEventListener("click",refreshAll);
document.getElementById("addRegionBtn").addEventListener("click",()=>{document.getElementById("searchResults").innerHTML="";document.getElementById("regionSearch").value="";document.getElementById("addDialog").showModal()});
document.getElementById("searchRegionBtn").addEventListener("click",async()=>{
 const q=document.getElementById("regionSearch").value.trim(), out=document.getElementById("searchResults");
 if(!q){toast("地域名を入力してください");return}
 out.innerHTML='<div class="loading">地域を検索しています…</div>';
 try{
  const url=new URL(GEO);url.search=new URLSearchParams({name:q,count:8,language:"ja",format:"json"}).toString();
  const r=await fetch(url), data=await r.json(), list=data.results||[];
  if(!list.length){out.innerHTML='<p class="hint">地域が見つかりませんでした。別の表記でお試しください。</p>';return}
  out.innerHTML=list.map((x,i)=>`<button class="result-button" data-index="${i}"><b>${esc(x.name)}</b><br><small>${esc([x.admin1,x.country].filter(Boolean).join("・"))}</small></button>`).join("");
  out.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
   const x=list[Number(b.dataset.index)], id=`${x.latitude.toFixed(4)}-${x.longitude.toFixed(4)}`;
   if(regions.some(r=>r.id===id)){toast("この地域は登録済みです");return}
   const region={id,name:x.name,admin:x.admin1||"",lat:x.latitude,lon:x.longitude};
   regions.push(region);selectedId=id;save();document.getElementById("addDialog").close();render();refreshAll();
  }));
 }catch(e){out.innerHTML='<p class="hint">検索に失敗しました。通信環境を確認してください。</p>'}
});
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}))}
refreshAll();
