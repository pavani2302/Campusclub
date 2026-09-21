let me=null, clubs=[], events=[];
async function load(){
 const mr=await api('/api/auth/me'); if(!mr.ok){location.href='/login.html';return} me=mr.data; userName.textContent=me.name;welcomeName.textContent=me.name;roleBadge.textContent=me.role;
 if(me.role==='ADMIN'){adminPanel.classList.remove('hidden');await loadStats()}
 await loadClubs(); await loadEvents(); await loadMine();
}
async function loadStats(){const r=await api('/api/admin/stats');stats.innerHTML=Object.entries(r.data).map(([k,v])=>`<div class="stat"><b>${v}</b>${k}</div>`).join('')}
async function loadClubs(){const r=await api('/api/clubs');clubs=r.data;clubsEl=clubs.map(c=>`<div class="card"><h3>${esc(c.name)}</h3><small>${esc(c.category||'General')}</small><p>${esc(c.description)}</p><p><b>Coordinator:</b> ${esc(c.coordinator||'Not specified')}</p>${me.role==='STUDENT'?`<button class="btn" onclick="joinClub(${c.id})">Join Club</button>`:''}</div>`).join('');document.getElementById('clubs').innerHTML=clubsEl;eventClub.innerHTML=clubs.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}
async function joinClub(id){const r=await api(`/api/clubs/${id}/join`,'POST');clubMsg.textContent=r.data.message||'';clubMsg.className=r.ok?'success':'error'}
async function loadEvents(){const r=await api('/api/events');events=r.data;document.getElementById('events').innerHTML=events.map(e=>`<div class="card"><h3>${esc(e.title)}</h3><small>${esc(e.eventDate)} • ${esc(e.venue)}</small><p>${esc(e.description)}</p><p><b>Club:</b> ${esc(e.club.name)}</p>${me.role==='STUDENT'?`<button class="btn" onclick="registerEvent(${e.id})">Register</button>`:''}</div>`).join('')}
async function registerEvent(id){const r=await api(`/api/events/${id}/register`,'POST');alert(r.data.message||'Done');await loadMine()}
async function loadMine(){if(me.role!=='STUDENT'){document.getElementById('mine').innerHTML='<p class="muted">Admin accounts manage registrations and attendance.</p>';return}const r=await api('/api/events/mine');document.getElementById('mine').innerHTML=r.data.length?r.data.map(x=>`<div class="card"><b>${esc(x.event.title)}</b><br>${esc(x.event.eventDate)} • ${esc(x.event.venue)}<br>Attendance: ${x.attended?'Present':'Not marked'}</div>`).join(''):'<p>No event registrations yet.</p>'}
clubForm?.addEventListener('submit',async e=>{e.preventDefault();const r=await api('/api/clubs','POST',{name:clubName.value,category:clubCategory.value,coordinator:clubCoordinator.value,description:clubDescription.value});alert(r.ok?'Club created':(r.data.message||'Failed'));if(r.ok){e.target.reset();loadClubs()}});
eventForm?.addEventListener('submit',async e=>{e.preventDefault();const r=await api('/api/events','POST',{title:eventTitle.value,description:eventDescription.value,eventDate:eventDate.value,venue:eventVenue.value,clubId:Number(eventClub.value)});alert(r.ok?'Event created':(r.data.message||'Failed'));if(r.ok){e.target.reset();loadEvents()}});
logout.onclick=async()=>{await api('/api/auth/logout','POST');location.href='/'};
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}load();
