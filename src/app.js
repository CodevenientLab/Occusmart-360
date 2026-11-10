(() => {
  'use strict';
  const KEY='occusmart360-demo-v1';
  function localDate(offset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  const seed={
    clients:[
      {id:'C101',name:'Sample Logistics (Demo)',contact:'Operations Manager',email:'demo-logistics@example.invalid',status:'Active'},
      {id:'C102',name:'Example Manufacturing (Demo)',contact:'HR Administrator',email:'demo-manufacturing@example.invalid',status:'Active'},
      {id:'C103',name:'Test Facilities (Demo)',contact:'HR Coordinator',email:'demo-facilities@example.invalid',status:'Prospect'}
    ],
    appointments:[
      {id:'A101',client:'C101',service:'Periodic assessments',date:localDate(5),count:12,status:'Scheduled'},
      {id:'A102',client:'C102',service:'Pre-employment assessments',date:localDate(7),count:8,status:'Scheduled'},
      {id:'A103',client:'C101',service:'Exit assessments',date:localDate(-2),count:3,status:'Completed'}
    ],
    invoices:[
      {id:'INV-101',client:'C101',amount:8500,due:localDate(9),status:'Unpaid'},
      {id:'INV-102',client:'C102',amount:4200,due:localDate(-6),status:'Unpaid'},
      {id:'INV-103',client:'C101',amount:2000,due:localDate(-10),status:'Paid'}
    ],
    tasks:[
      {id:'T101',title:'Confirm sample employer booking',owner:'Administration',due:localDate(2),status:'Open'},
      {id:'T102',title:'Follow up demonstration invoice',owner:'Finance',due:localDate(-5),status:'Open'},
      {id:'T103',title:'Review operational checklist',owner:'Management',due:localDate(-1),status:'Done'}
    ]};
  const clone=x=>JSON.parse(JSON.stringify(x));
  let state;
  try {const raw=localStorage.getItem(KEY); const saved=raw?JSON.parse(raw):null;state=saved&&['clients','appointments','invoices','tasks'].every(k=>Array.isArray(saved[k]))?saved:clone(seed)} catch {state=clone(seed)}
  let view='overview',search='',editing=null;
  const app=document.querySelector('#app'),dlg=document.querySelector('#editor');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',minimumFractionDigits:2}).format(Number(v)||0);
  const client=id=>state.clients.find(x=>x.id===id)?.name||'Unassigned';
  const save = message => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      notify(message);
    } catch {
      notify('Browser storage unavailable — changes may not persist');
    }
  };
  let feedbackTimer;
  const notify=msg=>{clearTimeout(feedbackTimer);const n=document.querySelector('#feedback');n.innerHTML='<div class="flash">'+esc(msg)+'</div>';feedbackTimer=setTimeout(()=>n.textContent='',2800)};
  function tag(status) {
    const positive = ['Paid', 'Completed', 'Done', 'Active'].includes(status);
    const pending = ['Unpaid', 'Open'].includes(status);
    const style = positive ? ' good' : pending ? ' warn' : '';
    return '<span class="tag' + style + '">' + esc(status) + '</span>';
  }
  const heading=(name,desc)=>'<h1>'+esc(name)+'</h1><p class="muted" style="margin:0">'+esc(desc)+'</p>';
  const card=(label,value,sub)=>'<div class="card"><div class="label">'+esc(label)+'</div><div class="number">'+esc(value)+'</div><div class="small muted">'+esc(sub)+'</div></div>';
  const cols={clients:['Name','Contact','Email','Status'],appointments:['Employer','Service','Date','People','Status'],invoices:['Invoice','Employer','Amount','Due','Status'],tasks:['Task','Owner','Due','Status']};
  const fields={
    clients:[['name','Employer name','text',true],['contact','Contact person / role','text',true],['email','Contact email','email',true],['status','Status','select:Active|Prospect|Inactive',true]],
    appointments:[['client','Employer','client',true],['service','Service / appointment type','text',true],['date','Appointment date','date',true],['count','People scheduled','number',true],['status','Status','select:Scheduled|Completed|Cancelled',true]],
    invoices:[['client','Employer','client',true],['amount','Invoice amount (ZAR)','number',true],['due','Due date','date',true],['status','Status','select:Unpaid|Paid|Void',true]],
    tasks:[['title','Task','text',true],['owner','Assigned team / owner','text',true],['due','Due date','date',true],['status','Status','select:Open|In progress|Done',true]]
  };
  const recordCells=(type,r)=>{
    if(type==='clients')return [r.name,r.contact,r.email,r.status];
    if(type==='appointments')return [client(r.client),r.service,r.date,r.count,r.status];
    if(type==='invoices')return [r.id,client(r.client),money(r.amount),r.due,r.status];
    return [r.title,r.owner,r.due,r.status];
  };
  function rows(type,records,actions=true){
    const heads=cols[type].map(x=>'<th scope="col">'+x+'</th>').join('');
    const body=records.map(r=>'<tr>'+recordCells(type,r).map((c,i)=>'<td>'+(i===cols[type].length-1?tag(c):esc(c))+'</td>').join('')+(actions?'<td><div class="actions"><button data-edit="'+esc(type)+':'+esc(r.id)+'">Edit</button><button data-remove="'+esc(type)+':'+esc(r.id)+'">Delete</button></div></td>':'')+'</tr>').join('');
    return '<div class="table-scroll"><table><thead><tr>'+heads+(actions?'<th scope="col">Actions</th>':'')+'</tr></thead><tbody>'+body+'</tbody></table></div>'+(records.length?'':'<div class="empty">No matching records.</div>');
  }
  function overview(){
    const unpaid=state.invoices.filter(x=>x.status==='Unpaid');
    const overdue=unpaid.filter(x=>x.due<localDate());
    const upcoming=state.appointments.filter(x=>x.status==='Scheduled' && x.date>=localDate()).sort((a,b)=>a.date.localeCompare(b.date));
    const open=state.tasks.filter(x=>x.status!=='Done');
    const received=state.invoices.filter(x=>x.status==='Paid').reduce((a,x)=>a+Number(x.amount),0);
    const revenue=state.invoices.filter(x=>x.status!=='Void').reduce((a,x)=>a+Number(x.amount),0);
    return heading('Business overview','Management visibility across employer accounts, bookings, collections and work.')
      +'<div class="toolbar"><div class="eyebrow">Executive summary</div><button class="btn" data-export="all">Export all data (JSON)</button></div>'
      +'<div class="kpis">'+card('Employer clients',state.clients.filter(x=>x.status==='Active').length,'Currently active')+card('Scheduled assessments',upcoming.reduce((a,x)=>a+Number(x.count),0),'People on scheduled bookings')+card('Outstanding invoices',money(unpaid.reduce((a,x)=>a+Number(x.amount),0)),'Unpaid balance')+card('Open work items',open.length,'Tasks requiring action')+'</div>'
      +'<div class="split"><section class="panel"><div class="panel-head"><h2>Upcoming appointments</h2><button class="btn" data-view="appointments">View all</button></div>'+rows('appointments',upcoming.slice(0,5),false)+'</section>'
      +'<section class="panel"><div class="panel-head"><h2>Collection snapshot</h2></div><div style="padding:20px"><div class="small muted">Recorded invoice value</div><h2 style="font-size:28px;margin:7px 0 15px">'+money(revenue)+'</h2><div class="bar-track"><div class="bar-fill" style="width:'+(revenue?Math.min(100,received/revenue*100):0)+'%"></div></div><p class="legend">'+money(received)+' marked paid</p><hr style="border:0;border-top:1px solid #d8e2e8;margin:20px 0"><p><strong>'+overdue.length+'</strong> overdue invoice(s)</p><p><strong>'+open.filter(x=>x.due<localDate()).length+'</strong> overdue work item(s)</p><p class="small muted">Demo figures reflect records entered here, not live accounting or banking data.</p></div></section></div>'
      +'<section class="panel"><div class="panel-head"><h2>Attention queue</h2><button class="btn" data-view="tasks">Open work queue</button></div>'+rows('tasks',open.sort((a,b)=>a.due.localeCompare(b.due)).slice(0,5),false)+'</section>';
  }
  function filteredRecords(type) {
    const query = search.toLowerCase();
    return state[type].filter(record => Object.values(record).join(' ').toLowerCase().includes(query)
      || (record.client && client(record.client).toLowerCase().includes(query)));
  }
  function listView(type){
    const titles={clients:['Employer clients','Manage corporate accounts and their contacts.'],appointments:['Appointments','Schedule and update employer assessment bookings.'],invoices:['Invoices','Track amounts billed, collected and due.'],tasks:['Work queue','Assign, track and close operational work items.']};
    const filtered=filteredRecords(type);
    return heading(...titles[type])+'<div class="toolbar"><div class="filters"><input id="filter" type="search" aria-label="Filter records" placeholder="Search records" value="'+esc(search)+'"></div><div class="filters"><button class="btn" data-export="'+type+'">Export CSV</button><button class="btn primary" data-add="'+type+'">+ Add '+(type==='clients'?'employer':type==='tasks'?'task':type.slice(0,-1))+'</button></div></div><section class="panel"><div class="panel-head"><h2 id="record-count">'+filtered.length+' records</h2><span class="small muted">Demo workspace</span></div>'+ '<div id="record-results">'+rows(type,filtered)+'</div></section>';
  }
  function render(){app.innerHTML=view==='overview'?overview():listView(view);document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));}
  function openEditor(type,id){
    editing={type,id};const r=id?state[type].find(x=>x.id===id):{};
    document.querySelector('#form-title').textContent=(id?'Edit ':'New ')+({clients:'employer',appointments:'appointment',invoices:'invoice',tasks:'task'}[type]);
    document.querySelector('#record-form').innerHTML=fields[type].map(([key,label,kind,req])=>{
      const value=r?.[key]??'';
      let input;
      if(kind==='client')input='<select name="'+key+'" required><option value="">Select employer</option>'+state.clients.map(c=>'<option value="'+esc(c.id)+'" '+(value===c.id?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select>';
      else if(kind.startsWith('select:'))input='<select name="'+key+'">'+kind.slice(7).split('|').map(o=>'<option '+(o===value?'selected':'')+'>'+esc(o)+'</option>').join('')+'</select>';
      else input='<input name="'+key+'" type="'+kind+'" value="'+esc(value)+'" '+(req?'required':'')+' '+(kind==='number'?'min="'+(key==='count'?'1':'0')+'" step="'+(key==='count'?'1':'0.01')+'"':'')+'>';
      return '<label class="field">'+esc(label)+input+'</label>';
    }).join('')+'<div class="form-buttons"><button type="button" class="btn" id="cancel">Cancel</button><button type="submit" class="btn primary">Save record</button></div>';
    dlg.showModal();document.querySelector('#cancel').onclick=()=>dlg.close();
  }
  function remove(type,id){
    if(type==='clients'&&(state.appointments.some(x=>x.client===id)||state.invoices.some(x=>x.client===id))){notify('Remove linked appointments and invoices first.');return}
    if(!confirm('Delete this demonstration record?'))return;
    state[type]=state[type].filter(x=>x.id!==id);save('Record deleted');render();
  }
  function download(name,content,mime){const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function exportRecords(type){
    if(type==='all'){download('occusmart-360-demo.json',JSON.stringify(state,null,2),'application/json');return}
    const keys=['id', ...fields[type].map(x=>x[0])];
    const quote = value => {
      const text = String(value ?? '');
      const safe = /^[\s]*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;
      return '"' + safe.replace(/"/g, '""') + '"';
    };
    const csv=[keys.map(quote).join(','),...state[type].map(r=>keys.map(k=>quote(r[k])).join(','))].join('\r\n');
    download('occusmart-'+type+'-demo.csv',csv,'text/csv');
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.view){view=b.dataset.view;search='';render()}
    if(b.dataset.add)openEditor(b.dataset.add,null);
    if(b.dataset.edit){const [t,id]=b.dataset.edit.split(':');openEditor(t,id)}
    if(b.dataset.remove){const [t,id]=b.dataset.remove.split(':');remove(t,id)}
    if(b.dataset.export)exportRecords(b.dataset.export);
  });
  document.querySelector('#close').addEventListener('click',()=>dlg.close());
  document.querySelector('#record-form').addEventListener('submit',e=>{
    e.preventDefault();if(!editing)return;
    const {type,id}=editing,values=Object.fromEntries(new FormData(e.currentTarget).entries());
    if(type==='appointments')values.count=Number(values.count);
    if(type==='invoices')values.amount=Number(values.amount);
    if(type==='appointments'&&values.count<1){notify('People scheduled must be at least 1');return}
    if(type==='invoices'&&values.amount<0){notify('Invoice amount cannot be negative');return}
    if(id){const idx=state[type].findIndex(x=>x.id===id);if(idx<0)return;state[type][idx]={...state[type][idx],...values}}
    else {const prefix={clients:'C',appointments:'A',invoices:'INV-',tasks:'T'}[type];state[type].push({id:prefix+Date.now().toString(36).toUpperCase(),...values})}
    save('Record saved');dlg.close();render();
  });
  app.addEventListener('input', event => {
    if (event.target.id !== 'filter') return;
    search = event.target.value;
    const records = filteredRecords(view);
    document.querySelector('#record-count').textContent = records.length + ' records';
    document.querySelector('#record-results').innerHTML = rows(view, records);
  });
  render();
})();
