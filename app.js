const KEY="html_hosting_studio_v1";
const $=s=>document.querySelector(s);

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function getProjects(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return[]}}
function setProjects(v){localStorage.setItem(KEY,JSON.stringify(v))}
function id(){return Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9)}
function toast(title,msg){const e=document.createElement("div");e.className="toast";e.innerHTML=`<strong>${esc(title)}</strong><span>${esc(msg)}</span>`;$("#toast").appendChild(e);setTimeout(()=>e.remove(),3000)}

function manager(){
document.title="HTML Hosting Studio";
$("#app").innerHTML=`
<div class="container">
  <section class="card header">
    <div><h1>📁 HTML Hosting Studio</h1><p class="muted">Create, preview and save HTML/CSS/JS projects.</p></div>
  </section>

  <section class="card">
    <h2>📤 Upload HTML</h2>
    <div class="upload" id="uploadBox">
      <div class="upload-icon">📄</div>
      <b>Click to upload an .html or .htm file</b>
      <p class="muted">The complete file contents will be loaded into the editor.</p>
      <input id="file" type="file" accept=".html,.htm,text/html" hidden>
    </div>
  </section>

  <section class="card">
    <h2>📝 Project</h2>
    <label for="name">Project name</label>
    <input id="name" placeholder="My Website">
    <label for="code">HTML / CSS / JS</label>
    <textarea id="code" placeholder="Paste a complete HTML document here..."></textarea>
    <div class="actions">
      <button class="btn" id="run">▶️ Preview / Run</button>
      <button class="btn green" id="save">💾 Save</button>
      <button class="btn dark" id="link">🔗 Create link</button>
      <button class="btn secondary" id="clear">🧹 Clear</button>
    </div>
    <div id="linkBox" class="link-box" hidden>
      <label for="hosted">Hosted link</label>
      <div class="link-row"><input id="hosted" readonly><button class="btn" id="copy">📋 Copy</button></div>
    </div>
  </section>

  <section class="card">
    <h2>👁️ Preview</h2>
    <iframe id="preview" class="preview" title="Project preview"></iframe>
  </section>

  <section class="card">
    <h2>🗂️ Saved projects</h2>
    <div id="projects" class="projects"></div>
  </section>
</div>`;

bindManager();
renderProjects();
}

function bindManager(){
const file=$("#file");
$("#uploadBox").onclick=()=>file.click();
file.onchange=()=>{
  const f=file.files[0]; if(!f)return;
  if(!/\.html?$/i.test(f.name)){toast("Invalid file","Please choose an HTML file.");return}
  const r=new FileReader();
  r.onload=()=>{$("#name").value=f.name.replace(/\.html?$/i,"");$("#code").value=r.result;run();toast("Uploaded","HTML file loaded into the editor.")};
  r.readAsText(f);
};
$("#run").onclick=run;
$("#save").onclick=save;
$("#link").onclick=createLink;
$("#copy").onclick=copy;
$("#clear").onclick=()=>{$("#name").value="";$("#code").value="";$("#hosted").value="";$("#linkBox").hidden=true;$("#preview").srcdoc="";toast("Cleared","The editor is ready for a new project.")};
}

function run(){
const code=$("#code").value;if(!code.trim()){toast("No code","Add HTML/CSS/JS first.");return}
$("#preview").srcdoc=code;toast("Preview started","The project is running in the preview frame.");
}

function save(){
const name=$("#name").value.trim(),code=$("#code").value;
if(!name)return toast("Project name required","Enter a project name.");
if(!code.trim())return toast("Code required","Add HTML/CSS/JS code.");
let p=getProjects(),x=p.find(v=>v.name===name);
if(x){x.code=code;x.updated=Date.now();toast("Updated","The project was updated.");}
else{x={id:id(),name,code,created:Date.now(),updated:Date.now()};p.push(x);toast("Saved","The project was saved in this browser.")}
setProjects(p);renderProjects();
}

function baseUrl(){
return location.origin+location.pathname;
}
function projectUrl(x){
return baseUrl()+"?project="+encodeURIComponent(x.id);
}
function createLink(){
const name=$("#name").value.trim(),code=$("#code").value;
if(!name)return toast("Project name required","Enter a project name.");
if(!code.trim())return toast("Code required","Add HTML/CSS/JS code.");
let p=getProjects(),x=p.find(v=>v.name===name);
if(!x){x={id:id(),name,code,created:Date.now(),updated:Date.now()};p.push(x)}
else{x.code=code;x.updated=Date.now()}
setProjects(p);
$("#hosted").value=projectUrl(x);$("#linkBox").hidden=false;renderProjects();toast("Link created","The link is ready to copy.");
}
async function copy(){
const v=$("#hosted").value;if(!v)return;
try{await navigator.clipboard.writeText(v)}catch{$("#hosted").select();document.execCommand("copy")}
toast("Copied","Hosted link copied to clipboard.");
}

function renderProjects(){
const box=$("#projects");if(!box)return;const p=getProjects();
if(!p.length){box.innerHTML=`<div class="empty">No saved projects yet.</div>`;return}
box.innerHTML=p.slice().reverse().map(x=>`
<div class="project">
<h3>📄 ${esc(x.name)}</h3>
<small>ID: ${esc(x.id)}</small><br>
<small>Updated: ${new Date(x.updated||x.created).toLocaleString()}</small>
<div class="project-actions">
<button class="btn" data-open="${esc(x.id)}">▶️ Open</button>
<button class="btn dark" data-link="${esc(x.id)}">🔗 Link</button>
<button class="btn danger" data-delete="${esc(x.id)}">🗑️ Delete</button>
</div></div>`).join("");
box.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openEditor(b.dataset.open));
box.querySelectorAll("[data-link]").forEach(b=>()=>{});
box.querySelectorAll("[data-link]").forEach(b=>b.onclick=()=>{const x=getProjects().find(v=>v.id===b.dataset.link);if(x){$("#hosted").value=projectUrl(x);$("#linkBox").hidden=false;window.scrollTo({top:0,behavior:"smooth"})}});
box.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>askDelete(b.dataset.delete));
}

function openEditor(i){
const x=getProjects().find(v=>v.id===i);if(!x)return;
$("#name").value=x.name;$("#code").value=x.code;run();window.scrollTo({top:0,behavior:"smooth"});toast("Opened","Project loaded into the editor.");
}

let pendingDelete=null;
function askDelete(i){pendingDelete=i;$("#confirmModal").classList.remove("hidden");$("#confirmText").textContent="This project will be removed from this browser."; }
$("#cancelDelete").onclick=()=>{pendingDelete=null;$("#confirmModal").classList.add("hidden")};
$("#confirmDelete").onclick=()=>{if(!pendingDelete)return;setProjects(getProjects().filter(x=>x.id!==pendingDelete));pendingDelete=null;$("#confirmModal").classList.add("hidden");renderProjects();toast("Deleted","The project was removed.");};

function hosted(){
const q=new URLSearchParams(location.search),pid=q.get("project");
if(!pid){manager();return}
const x=getProjects().find(v=>v.id===pid);
if(!x){document.body.innerHTML=`<main style="font-family:system-ui;text-align:center;padding:60px"><h2>❌ Project not found</h2><p>This browser does not contain the saved project data.</p></main>`;return}
document.title=x.name;
document.body.innerHTML=x.code;
}
hosted();
