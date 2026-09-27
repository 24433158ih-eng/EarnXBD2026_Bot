/*
 GitHub Project Hosting Studio
 Browser-only GitHub uploader.

 IMPORTANT:
 - Never hard-code a GitHub token in this file.
 - Token is held only in memory.
 - Uses Git Data API (blobs -> tree -> commit -> ref) so a project
   containing many files can be uploaded as one commit.
*/

const $ = id => document.getElementById(id);
let state = { token:"", owner:"", repo:"", branch:"main" };

function headers(){
  return {
    "Accept":"application/vnd.github+json",
    "Authorization":"Bearer "+state.token,
    "X-GitHub-Api-Version":"2022-11-28"
  };
}
function setStatus(el,msg,ok=true){
  el.textContent=msg;
  el.className="status "+(ok?"ok":"bad");
}
function log(msg){
  $("log").textContent += msg+"\\n";
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

$("zip").addEventListener("change",()=>{
  $("fileName").textContent=$("zip").files[0]?.name || "কোনো ZIP নির্বাচন করা হয়নি";
});

$("clearBtn").onclick=()=>{
  state={token:"",owner:"",repo:"",branch:"main"};
  $("token").value=""; $("owner").value=""; $("repo").value="";
  $("connection").textContent="Session cleared";
  $("connection").className="status";
};

$("checkBtn").onclick=async()=>{
  readSettings();
  if(!state.token||!state.owner||!state.repo){
    setStatus($("connection"),"Token, owner এবং repository দিন।",false); return;
  }
  try{
    const r=await fetch(`https://api.github.com/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}`,{headers:headers()});
    const d=await r.json();
    if(!r.ok) throw new Error(d.message||"GitHub error");
    setStatus($("connection"),`Connected: ${d.full_name} | default branch: ${d.default_branch}`);
    $("branch").value=state.branch || d.default_branch;
  }catch(e){setStatus($("connection"),e.message,false);}
};

function readSettings(){
  state.token=$("token").value.trim();
  state.owner=$("owner").value.trim();
  state.repo=$("repo").value.trim();
  state.branch=$("branch").value.trim()||"main";
}

function b64(bytes){
  let binary="";
  const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk)
    binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
  return btoa(binary);
}
async function api(path,options={}){
  const r=await fetch("https://api.github.com"+path,{
    ...options,
    headers:{...headers(),...(options.headers||{})}
  });
  const text=await r.text();
  let data; try{data=JSON.parse(text)}catch{data=text}
  if(!r.ok) throw new Error((data&&data.message)||`HTTP ${r.status}`);
  return data;
}
function safePath(p){
  return p.replace(/\\/g,"/").replace(/^\/+/,"").split("/")
    .filter(x=>x && x!=="." && x!=="..").join("/");
}
function base64ToBytes(data){
  const raw=atob(data);
  const out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}

async function unzip(file){
  // Browser-native DecompressionStream cannot read ZIP containers.
  // This project includes fflate from CDN dynamically.
  if(!window.fflate){
    await new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js";
      s.onload=resolve;s.onerror=()=>reject(new Error("ZIP library load failed"));
      document.head.appendChild(s);
    });
  }
  const buf=new Uint8Array(await file.arrayBuffer());
  const files=window.fflate.unzipSync(buf);
  return Object.entries(files)
    .filter(([name,data])=>!name.endsWith("/") && data.length>=0)
    .map(([name,data])=>({name:safePath(name),data}));
}

function normalizeFiles(files,rootMode,folder){
  // Remove empty/unsafe entries and optionally flatten a single top-level folder.
  let out=files.filter(x=>x.name);
  const parts=out.map(x=>x.name.split("/")[0]).filter(Boolean);
  const unique=[...new Set(parts)];
  if(!rootMode && unique.length===1){
    const prefix=unique[0]+"/";
    if(out.some(x=>x.name===prefix+"index.html")){
      out=out.map(x=>({...x,name:x.name.slice(prefix.length)}));
    }
  }
  if(rootMode) return out;
  const base=safePath(folder).replace(/\/+$/,"");
  return out.map(x=>({...x,name:base+"/"+x.name}));
}

$("uploadBtn").onclick=async()=>{
  readSettings();
  $("log").textContent="";
  $("bar").style.width="0%";

  if(!state.token||!state.owner||!state.repo){
    log("প্রথমে GitHub settings পূরণ করুন।"); return;
  }
  const file=$("zip").files[0];
  if(!file){log("একটি ZIP নির্বাচন করুন।");return;}
  if(!/\.zip$/i.test(file.name)){log("শুধু ZIP file দিন।");return;}

  try{
    log("ZIP পড়া হচ্ছে...");
    const raw=await unzip(file);
    if(!raw.length) throw new Error("ZIP-এ কোনো file পাওয়া যায়নি।");
    let files=normalizeFiles(raw,$("pagesRoot").checked,$("folder").value);
    if(!files.some(x=>x.name.toLowerCase()==="index.html") &&
       !files.some(x=>x.name.toLowerCase().endsWith("/index.html"))){
      throw new Error("Project-এর ভিতরে index.html পাওয়া যায়নি।");
    }
    if(files.length>2000) throw new Error("এই browser uploader-এ সর্বোচ্চ 2000 files রাখা হয়েছে।");

    log(`মোট ${files.length}টি file পাওয়া গেছে।`);
    $("bar").style.width="10%";

    // Get current branch reference and base commit.
    let ref;
    try{
      ref=await api(`/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/git/ref/heads/${encodeURIComponent(state.branch)}`);
    }catch{
      // Branch may not exist. Create from default branch.
      const repo=await api(`/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}`);
      const base=repo.default_branch||"main";
      const br=await api(`/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/git/ref/heads/${encodeURIComponent(base)}`);
      state.branch=$("branch").value=base;
      ref=br;
    }
    const baseSha=ref.object.sha;
    const commit=await api(`/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/git/commits/${baseSha}`);
    const baseTree=commit.tree.sha;

    // Create blobs.
    const tree=[];
    for(let i=0;i<files.length;i++){
      const f=files[i];
      const blob=await api(`/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/git/blobs`,{
        method:"POST",
        body:JSON.stringify({content:b64(f.data),encoding:"base64"})
      });
      tree.push({path:f.name,mode:"100644",type:"blob",sha:blob.sha});
      $("bar").style.width=(10+Math.round((i+1)/files.length*65))+"%";
      if((i+1)%20===0) log(`Blobs: ${i+1}/${files.length}`);
    }

    log("Git tree তৈরি হচ্ছে...");
    const newTree=await api(`/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/git/trees`,{
      method:"POST",body:JSON.stringify({base_tree:baseTree,tree})
    });

    log("Commit তৈরি হচ্ছে...");
    const newCommit=await api(`/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/git/commits`,{
      method:"POST",
      body:JSON.stringify({
        message:"Upload website project",
        tree:newTree.sha,
        parents:[baseSha]
      })
    });

    log("GitHub branch update হচ্ছে...");
    await api(`/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/git/refs/heads/${encodeURIComponent(state.branch)}`,{
      method:"PATCH",
      body:JSON.stringify({sha:newCommit.sha,force:false})
    });

    $("bar").style.width="100%";
    log("সফল! Project GitHub-এ upload হয়েছে।");
    log("Commit: "+newCommit.sha);
    showPossibleUrl();
  }catch(e){
    log("ERROR: "+e.message);
    $("bar").style.width="0%";
  }
};

function showPossibleUrl(){
  const base=`https://${state.owner}.github.io/${state.repo}/`;
  const folder=safePath($("folder").value);
  const url=$("pagesRoot").checked?base:base+folder.replace(/^\/+/,"").replace(/\/+$/,"")+"/";
  $("live").innerHTML=`<a target="_blank" rel="noopener" href="${url}">সম্ভাব্য GitHub Pages URL: ${url}</a>
  <small>Pages enable/প্রকাশ হতে কিছু সময় লাগতে পারে।</small>`;
}

$("pagesBtn").onclick=async()=>{
  readSettings();
  try{
    const d=await api(`/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/pages`);
    setStatus($("pages"),`Pages status: ${d.status||"unknown"} | URL: ${d.html_url||"not available"}`);
    if(d.html_url) $("live").innerHTML=`<a target="_blank" href="${d.html_url}">${d.html_url}</a>`;
  }catch(e){
    setStatus($("pages"),e.message,false);
  }
};