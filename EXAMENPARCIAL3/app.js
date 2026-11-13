const K='inv_refacciones_v1';
const P=[["RF-001","Rodamiento 6205-2RS","Rodamientos",40,10,"A-01"],["RF-002","Rodamiento 6308","Rodamientos",6,8,"A-01"],["RF-003","Banda trapezoidal B58","Transmisión",25,8,"A-02"],["RF-004","Cadena de rodillos 80","Transmisión",9,5,"A-02"],["RF-005","Piñón 16 dientes","Transmisión",14,4,"A-03"],["RF-006","Sello hidráulico 50 mm","Sellos",0,10,"B-01"],["RF-007","Empaque de brida 4 pulg","Sellos",60,15,"B-01"],["RF-008","Manguera hidráulica 1/2","Hidráulica",18,6,"B-02"],["RF-009","Válvula check 3/4","Hidráulica",12,4,"B-02"],["RF-010","Bomba de engranes 10 GPM","Hidráulica",3,2,"B-03"],["RF-011","Contactor 25A 220V","Eléctrico",20,6,"C-01"],["RF-012","Relevador térmico 18A","Eléctrico",5,5,"C-01"],["RF-013","Motor trifásico 1 HP","Eléctrico",4,2,"C-02"],["RF-014","Variador de frecuencia 5 HP","Eléctrico",2,2,"C-02"],["RF-015","Sensor inductivo M18","Sensores",30,10,"C-03"],["RF-016","Termopar tipo K","Sensores",0,6,"C-03"],["RF-017","Filtro de aceite HF-35","Filtros",22,8,"D-01"],["RF-018","Filtro de aire industrial","Filtros",7,8,"D-01"],["RF-019","Aceite hidráulico ISO 68 (cubeta)","Lubricantes",11,4,"D-02"],["RF-020","Grasa EP-2 (cartucho)","Lubricantes",48,12,"D-02"],["RF-021","Tornillo grado 8 M12 (caja)","Fijación",35,10,"E-01"],["RF-022","Acoplamiento flexible L-100","Transmisión",8,3,"A-03"]];
function seed(){const t=new Date().toLocaleString('es-MX');const parts=P.map((p,i)=>({id:i+1,code:p[0],name:p[1],cat:p[2],qty:p[3],min:p[4],loc:p[5]}));
 return{parts,users:[{u:'admin',p:'admin123',role:'admin',name:'Ana Administradora'},{u:'gerente',p:'gerente123',role:'gerente',name:'Gabriel Gerente'},{u:'tecnico',p:'tecnico123',role:'tecnico',name:'Tomás Técnico'}],
 reqs:[],moves:parts.filter(p=>p.qty>0).map((p,i)=>({id:i+1,d:t,pid:p.id,type:'Entrada',qty:p.qty,by:'admin',ref:'Inventario inicial'})),seq:100}}
let S;try{S=JSON.parse(localStorage.getItem(K))}catch(e){}
if(!S||!S.parts)S=seed();
let me=null,view='dash';
function save(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}}
const $=i=>document.getElementById(i);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now=()=>new Date().toLocaleString('es-MX');
const part=id=>S.parts.find(p=>p.id==id)||{code:'?',name:'(eliminada)',qty:0,min:0};
const st=p=>p.qty<=0?['Agotada','t-er']:p.qty<=p.min?['Stock bajo','t-wa']:['Disponible','t-ok'];
const tag=(t,c)=>`<span class="tag ${c}">${t}</span>`;
const RN={admin:'Administrador',gerente:'Gerente',tecnico:'Técnico'};
function toast(m){const t=$('toast');t.textContent=m;t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display='none',2600)}
function fill(u,p){$('lu').value=u;$('lp').value=p;login()}
function login(){const u=S.users.find(x=>x.u===$('lu').value.trim()&&x.p===$('lp').value);
 if(!u){$('lerr').textContent='Usuario o contraseña incorrectos.';return}
 me=u;$('lerr').textContent='';$('login').style.display='none';$('app').style.display='block';view='dash';render()}
function logout(){me=null;$('app').style.display='none';$('login').style.display='grid';$('lp').value=''}
const MENU={admin:[['dash','Dashboard'],['parts','Piezas'],['moves','Movimientos'],['users','Usuarios']],gerente:[['dash','Dashboard'],['parts','Inventario'],['reqs','Solicitudes'],['moves','Movimientos'],['rep','Reportes']],tecnico:[['dash','Dashboard'],['parts','Piezas'],['reqs','Mis solicitudes']]};
function go(v){view=v;render()}
function render(){
 $('side').innerHTML=`<h2>Almacén</h2><div class="who">${esc(me.name)}<br>${RN[me.role]}</div>`+MENU[me.role].map(m=>`<a class="${view===m[0]?'on':''}" onclick="go('${m[0]}')">${m[1]}</a>`).join('')+`<div class="bot"><button class="btn sec sm" style="color:#fff;border-color:#55636f" onclick="logout()">Cerrar sesión</button></div>`;
 $('main').innerHTML=({dash,parts:partsV,reqs:reqsV,moves:movesV,users:usersV,rep:repV})[view]();
}
function dash(){
 const a=S.parts.filter(p=>p.qty<=0),b=S.parts.filter(p=>p.qty>0&&p.qty<=p.min),pend=S.reqs.filter(r=>r.st==='Pendiente');
 const al=a.map(p=>`<div class="alert t-er"><b>Agotada:</b> ${esc(p.code)} ${esc(p.name)} (${esc(p.loc)})</div>`).join('')+b.map(p=>`<div class="alert t-wa"><b>Stock bajo:</b> ${esc(p.code)} ${esc(p.name)}: quedan ${p.qty}, mínimo ${p.min}</div>`).join('');
 const mv=S.moves.slice(-6).reverse().map(m=>`<tr><td>${m.d}</td><td>${esc(part(m.pid).code)}</td><td>${tag(m.type,m.type==='Entrada'?'t-ok':'t-bl')}</td><td>${m.qty}</td><td>${esc(m.by)}</td></tr>`).join('');
 return`<h1>Dashboard</h1><div class="kpis"><div class="kpi"><b>${S.parts.length}</b><span>Piezas registradas</span></div><div class="kpi"><b>${S.parts.reduce((s,p)=>s+p.qty,0)}</b><span>Unidades en almacén</span></div><div class="kpi e"><b>${a.length}</b><span>Piezas agotadas</span></div><div class="kpi w"><b>${b.length}</b><span>Con stock bajo</span></div><div class="kpi"><b>${pend.length}</b><span>Solicitudes pendientes</span></div></div>
 <div class="card"><h3>Alertas de inventario</h3>${al||'<div class="empty">Sin alertas.</div>'}</div>
 <div class="card"><h3>Últimos movimientos</h3><div class="tw"><table><tr><th>Fecha</th><th>Pieza</th><th>Tipo</th><th>Cant.</th><th>Usuario</th></tr>${mv}</table></div></div>`}
let q='',cat='';
function partsV(){
 const cats=[...new Set(S.parts.map(p=>p.cat))].sort();
 const rows=S.parts.filter(p=>(!cat||p.cat===cat)&&(p.code+p.name+p.cat+p.loc).toLowerCase().includes(q.toLowerCase())).map(p=>{const s=st(p);
  let ac='';if(me.role==='admin')ac=`<button class="btn sm sec" onclick="partForm(${p.id})">Editar</button> <button class="btn sm sec" onclick="entry(${p.id})">Entrada</button> <button class="btn sm er" onclick="delPart(${p.id})">Eliminar</button>`;
  if(me.role==='tecnico')ac=p.qty>0?`<button class="btn sm" onclick="reqForm(${p.id})">Solicitar</button>`:'';
  return`<tr><td>${esc(p.code)}</td><td>${esc(p.name)}</td><td>${esc(p.cat)}</td><td><b>${p.qty}</b></td><td>${p.min}</td><td>${esc(p.loc)}</td><td>${tag(s[0],s[1])}</td><td>${ac}</td></tr>`}).join('');
 return`<h1>${me.role==='admin'?'Administrar piezas':'Inventario'}</h1><div class="bar"><input id="sq" placeholder="Buscar por código, nombre, categoría o ubicación" value="${esc(q)}" oninput="q=this.value;keep()"><select onchange="cat=this.value;render()"><option value="">Todas las categorías</option>${cats.map(c=>`<option ${c===cat?'selected':''}>${esc(c)}</option>`).join('')}</select>${me.role==='admin'?'<button class="btn" onclick="partForm()">Nueva pieza</button>':''}</div>
 <div class="card tw"><table><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Existencia</th><th>Mínimo</th><th>Ubicación</th><th>Estado</th><th></th></tr>${rows||'<tr><td colspan="8" class="empty">No se encontraron piezas.</td></tr>'}</table></div>`}
function keep(){const p=$('sq').selectionStart;render();const e=$('sq');e.focus();e.setSelectionRange(p,p)}
function modal(title,html,ok,label){const d=$('dlg');d.innerHTML=`<h3>${title}</h3>${html}<div class="err" id="derr"></div><div class="acts"><button class="btn sec" onclick="$('dlg').close()">Cancelar</button><button class="btn" id="dok">${label||'Guardar'}</button></div>`;
 $('dok').onclick=()=>{const r=ok();if(r){$('derr').textContent=r}else{d.close();render()}};d.showModal()}
function partForm(id){const p=id?part(id):{code:'',name:'',cat:'',qty:0,min:5,loc:''};
 modal(id?'Editar pieza':'Nueva pieza',`<label>Código</label><input id="f1" value="${esc(p.code)}"><label>Nombre</label><input id="f2" value="${esc(p.name)}"><label>Categoría</label><input id="f3" value="${esc(p.cat)}"><label>Cantidad</label><input id="f4" type="number" min="0" value="${p.qty}" ${id?'disabled':''}><label>Mínimo antes de alerta</label><input id="f5" type="number" min="0" value="${p.min}"><label>Ubicación</label><input id="f6" value="${esc(p.loc)}">`,()=>{
  const v=[1,2,3,4,5,6].map(i=>$('f'+i).value.trim());if(!v[0]||!v[1]||!v[2]||!v[5])return'Completa código, nombre, categoría y ubicación.';
  if(S.parts.some(x=>x.code===v[0]&&x.id!==id))return'Ya existe una pieza con ese código.';
  if(+v[3]<0||+v[4]<0)return'Las cantidades no pueden ser negativas.';
  if(id){Object.assign(p,{code:v[0],name:v[1],cat:v[2],min:+v[4],loc:v[5]});toast('Pieza actualizada')}
  else{const n={id:++S.seq,code:v[0],name:v[1],cat:v[2],qty:+v[3]||0,min:+v[4],loc:v[5]};S.parts.push(n);if(n.qty>0)S.moves.push({id:++S.seq,d:now(),pid:n.id,type:'Entrada',qty:n.qty,by:me.u,ref:'Alta de pieza'});toast('Pieza registrada')}save()})}
function delPart(id){const p=part(id);modal('Eliminar pieza',`<p>¿Eliminar ${esc(p.code)} ${esc(p.name)}? Esta acción no se puede deshacer.</p>`,()=>{S.parts=S.parts.filter(x=>x.id!==id);save();toast('Pieza eliminada')},'Eliminar')}
function entry(id){const p=part(id);modal('Entrada de material',`<p>${esc(p.code)} ${esc(p.name)}. Existencia actual: ${p.qty}</p><label>Cantidad que ingresa</label><input id="f1" type="number" min="1"><label>Referencia (factura, proveedor)</label><input id="f2">`,()=>{
 const n=parseInt($('f1').value);if(!(n>0))return'Escribe una cantidad mayor a cero.';p.qty+=n;S.moves.push({id:++S.seq,d:now(),pid:id,type:'Entrada',qty:n,by:me.u,ref:$('f2').value.trim()||'Reabastecimiento'});save();toast('Entrada registrada')},'Registrar entrada')}
function reqForm(id){const p=part(id);modal('Solicitar material',`<p>${esc(p.code)} ${esc(p.name)}. Disponibles: ${p.qty}</p><label>Cantidad</label><input id="f1" type="number" min="1" max="${p.qty}"><label>Máquina o motivo</label><textarea id="f2" rows="2"></textarea>`,()=>{
 const n=parseInt($('f1').value),m=$('f2').value.trim();if(!(n>0))return'Escribe una cantidad mayor a cero.';if(n>p.qty)return'Solo hay '+p.qty+' piezas disponibles.';if(!m)return'Indica la máquina o el motivo.';
 S.reqs.push({id:++S.seq,d:now(),pid:id,qty:n,tech:me.u,note:m,st:'Pendiente',by:'',rd:'',why:''});save();toast('Solicitud enviada');view='reqs'},'Enviar solicitud')}
function reqsV(){
 const list=(me.role==='tecnico'?S.reqs.filter(r=>r.tech===me.u):S.reqs).slice().reverse();
 const rows=list.map(r=>{const c=r.st==='Pendiente'?'t-wa':r.st==='Aprobada'?'t-ok':'t-er';
  const ac=me.role==='gerente'&&r.st==='Pendiente'?`<button class="btn sm ok" onclick="approve(${r.id})">Aprobar</button> <button class="btn sm er" onclick="reject(${r.id})">Rechazar</button>`:'';
  return`<tr><td>#${r.id}</td><td>${r.d}</td><td>${esc(part(r.pid).code)} ${esc(part(r.pid).name)}</td><td>${r.qty}</td><td>${esc(r.tech)}</td><td style="white-space:normal">${esc(r.note)}</td><td>${tag(r.st,c)}${r.why?'<br><small>'+esc(r.why)+'</small>':''}</td><td>${ac}</td></tr>`}).join('');
 return`<h1>${me.role==='tecnico'?'Mis solicitudes':'Solicitudes de material'}</h1>${me.role==='tecnico'?'<p class="noprint" style="color:var(--mu)">Para pedir material, elige una pieza en la sección Piezas.</p>':''}<div class="card tw"><table><tr><th>Folio</th><th>Fecha</th><th>Pieza</th><th>Cant.</th><th>Técnico</th><th>Motivo</th><th>Estado</th><th></th></tr>${rows||'<tr><td colspan="8" class="empty">No hay solicitudes.</td></tr>'}</table></div>`}
function approve(id){const r=S.reqs.find(x=>x.id===id),p=part(r.pid);
 if(r.qty>p.qty){toast('Existencias insuficientes: hay '+p.qty);return}
 p.qty-=r.qty;r.st='Aprobada';r.by=me.u;r.rd=now();S.moves.push({id:++S.seq,d:now(),pid:r.pid,type:'Salida',qty:r.qty,by:r.tech,ref:'Solicitud #'+r.id+' autorizada por '+me.u});save();toast('Solicitud aprobada. Inventario actualizado');render()}
function reject(id){modal('Rechazar solicitud #'+id,`<label>Motivo del rechazo</label><textarea id="f1" rows="2"></textarea>`,()=>{const r=S.reqs.find(x=>x.id===id);r.st='Rechazada';r.by=me.u;r.rd=now();r.why=$('f1').value.trim()||'Sin motivo indicado';save();toast('Solicitud rechazada')},'Rechazar')}
function movesV(){
 const rows=S.moves.slice().reverse().map(m=>`<tr><td>${m.d}</td><td>${esc(part(m.pid).code)} ${esc(part(m.pid).name)}</td><td>${tag(m.type,m.type==='Entrada'?'t-ok':'t-bl')}</td><td>${m.qty}</td><td>${esc(m.by)}</td><td>${esc(m.ref)}</td></tr>`).join('');
 return`<h1>Movimientos de inventario</h1><div class="card tw"><table><tr><th>Fecha</th><th>Pieza</th><th>Tipo</th><th>Cant.</th><th>Usuario</th><th>Referencia</th></tr>${rows}</table></div>`}
function usersV(){
 const rows=S.users.map(u=>`<tr><td>${esc(u.u)}</td><td>${esc(u.name)}</td><td>${tag(RN[u.role],'t-bl')}</td><td><button class="btn sm sec" onclick="userForm('${esc(u.u)}')">Editar</button> ${u.u===me.u?'':`<button class="btn sm er" onclick="delUser('${esc(u.u)}')">Eliminar</button>`}</td></tr>`).join('');
 return`<h1>Usuarios</h1><div class="bar"><button class="btn" onclick="userForm()">Nuevo usuario</button></div><div class="card tw"><table><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th></th></tr>${rows}</table></div>`}
function userForm(un){const u=un?S.users.find(x=>x.u===un):{u:'',p:'',name:'',role:'tecnico'};
 modal(un?'Editar usuario':'Nuevo usuario',`<label>Usuario</label><input id="f1" value="${esc(u.u)}" ${un?'disabled':''}><label>Nombre completo</label><input id="f2" value="${esc(u.name)}"><label>Contraseña</label><input id="f3" value="${esc(u.p)}"><label>Rol</label><select id="f4">${Object.keys(RN).map(r=>`<option value="${r}" ${r===u.role?'selected':''}>${RN[r]}</option>`).join('')}</select>`,()=>{
  const a=$('f1').value.trim(),b=$('f2').value.trim(),c=$('f3').value;if(!a||!b||c.length<4)return'Completa todos los campos. La contraseña necesita 4 caracteres o más.';
  if(!un&&S.users.some(x=>x.u===a))return'Ese usuario ya existe.';
  if(un){Object.assign(u,{name:b,p:c,role:$('f4').value})}else S.users.push({u:a,name:b,p:c,role:$('f4').value});save();toast('Usuario guardado')})}
function delUser(un){modal('Eliminar usuario',`<p>¿Eliminar al usuario ${esc(un)}?</p>`,()=>{S.users=S.users.filter(x=>x.u!==un);save();toast('Usuario eliminado')},'Eliminar')}
function repV(){
 const by={};S.parts.forEach(p=>{by[p.cat]=by[p.cat]||{n:0,u:0};by[p.cat].n++;by[p.cat].u+=p.qty});
 const sal={};S.moves.filter(m=>m.type==='Salida').forEach(m=>sal[m.pid]=(sal[m.pid]||0)+m.qty);
 const top=Object.entries(sal).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,n])=>`<tr><td>${esc(part(id).code)} ${esc(part(id).name)}</td><td>${n}</td></tr>`).join('');
 const cnt=s=>S.reqs.filter(r=>r.st===s).length;
 const crit=S.parts.filter(p=>p.qty<=p.min).map(p=>`<tr><td>${esc(p.code)} ${esc(p.name)}</td><td>${p.qty}</td><td>${p.min}</td><td>${tag(st(p)[0],st(p)[1])}</td></tr>`).join('');
 return`<h1>Reportes</h1><div class="bar noprint"><button class="btn" onclick="window.print()">Imprimir o guardar PDF</button></div><p style="color:var(--mu)">Generado el ${now()} por ${esc(me.name)}</p>
 <div class="card tw"><h3>Existencias por categoría</h3><table><tr><th>Categoría</th><th>Piezas</th><th>Unidades</th></tr>${Object.entries(by).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${v.n}</td><td>${v.u}</td></tr>`).join('')}</table></div>
 <div class="card tw"><h3>Piezas por reabastecer</h3><table><tr><th>Pieza</th><th>Existencia</th><th>Mínimo</th><th>Estado</th></tr>${crit||'<tr><td colspan="4" class="empty">Ninguna.</td></tr>'}</table></div>
 <div class="card tw"><h3>Solicitudes</h3><p>Pendientes: ${cnt('Pendiente')}. Aprobadas: ${cnt('Aprobada')}. Rechazadas: ${cnt('Rechazada')}.</p></div>
 <div class="card tw"><h3>Piezas con más salidas</h3><table><tr><th>Pieza</th><th>Unidades</th></tr>${top||'<tr><td colspan="2" class="empty">Aún no hay salidas.</td></tr>'}</table></div>`}
$('lp').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
