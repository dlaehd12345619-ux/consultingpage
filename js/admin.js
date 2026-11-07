import { supabase } from './supabase.js';

const $ = (sel) => document.querySelector(sel);
const STATUS = { new: '신규', contacted: '연락함', done: '완료' };

let rows = [];
let filter = 'all';
let query = '';

/* 문의 내용은 방문자가 입력한 값이므로 반드시 이스케이프해서 출력한다. */
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtDate = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const show = (id) => {
  ['viewConfig', 'viewLogin', 'viewApp'].forEach((v) => { $('#' + v).hidden = v !== id; });
};

const showAppError = (msg) => {
  const el = $('#appError');
  el.textContent = msg || '';
  el.hidden = !msg;
};

/* ---------- 목록 ---------- */
const matches = (r) => {
  if (filter !== 'all' && r.status !== filter) return false;
  if (!query) return true;
  const hay = [r.school, r.name, r.phone, r.email, r.interest, r.message].join(' ').toLowerCase();
  return hay.includes(query);
};

const renderStats = () => {
  const count = (s) => rows.filter((r) => r.status === s).length;
  $('#stats').innerHTML = `
    <div class="stat"><span>전체</span><b>${rows.length}</b></div>
    <div class="stat s-new"><span>신규</span><b>${count('new')}</b></div>
    <div class="stat"><span>연락함</span><b>${count('contacted')}</b></div>
    <div class="stat"><span>완료</span><b>${count('done')}</b></div>`;
};

const render = () => {
  renderStats();
  const list = rows.filter(matches);
  $('#empty').hidden = list.length > 0;
  $('#list').innerHTML = list.map((r) => `
    <article class="card status-${esc(r.status)}" data-id="${r.id}">
      <div class="card-head">
        <div>
          <span class="tag">${esc(r.interest)}</span>
          <span class="date">${fmtDate(r.created_at)}</span>
        </div>
        <select class="status-select" data-id="${r.id}" aria-label="처리 상태">
          ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="card-who">
        <b>${esc(r.name)}</b>
        ${r.school ? `<span class="school">${esc(r.school)}</span>` : ''}
      </div>
      <div class="contacts">
        <a href="tel:${esc(r.phone)}"><i class="fas fa-phone"></i> ${esc(r.phone)}</a>
        ${r.email ? `<a href="mailto:${esc(r.email)}"><i class="fas fa-envelope"></i> ${esc(r.email)}</a>` : ''}
      </div>
      <p class="message">${esc(r.message)}</p>
      <div class="card-foot">
        <button class="link-danger" data-del="${r.id}"><i class="fas fa-trash"></i> 삭제</button>
      </div>
    </article>`).join('');
};

const load = async () => {
  showAppError('');
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    showAppError('문의를 불러오지 못했습니다: ' + error.message);
    return;
  }
  rows = data || [];
  render();
  if (rows.length === 0) {
    showAppError('');
  }
};

/* ---------- 상태 변경 / 삭제 ---------- */
$('#list').addEventListener('change', async (e) => {
  const sel = e.target.closest('.status-select');
  if (!sel) return;
  const id = Number(sel.dataset.id);
  const status = sel.value;
  const prev = rows.find((r) => r.id === id)?.status;
  const { error } = await supabase.from('inquiries').update({ status }).eq('id', id);
  if (error) {
    showAppError('상태를 바꾸지 못했습니다: ' + error.message);
    sel.value = prev;
    return;
  }
  rows = rows.map((r) => (r.id === id ? { ...r, status } : r));
  render();
});

$('#list').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-del]');
  if (!btn) return;
  const id = Number(btn.dataset.del);
  const r = rows.find((x) => x.id === id);
  if (!confirm(`${r?.name || '이'} 님의 문의를 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`)) return;
  const { error } = await supabase.from('inquiries').delete().eq('id', id);
  if (error) { showAppError('삭제하지 못했습니다: ' + error.message); return; }
  rows = rows.filter((x) => x.id !== id);
  render();
});

/* ---------- 필터 / 검색 ---------- */
$('#tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  filter = tab.dataset.filter;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
  render();
});
$('#search').addEventListener('input', (e) => {
  query = e.target.value.trim().toLowerCase();
  render();
});

/* ---------- CSV 내려받기 (엑셀 한글 깨짐 방지용 BOM 포함) ---------- */
$('#csvBtn').addEventListener('click', () => {
  const cols = [['접수일시', 'created_at'], ['대학·부서', 'school'], ['담당자', 'name'], ['연락처', 'phone'], ['이메일', 'email'], ['관심 영역', 'interest'], ['문의 내용', 'message'], ['상태', 'status']];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [cols.map((c) => cell(c[0])).join(',')];
  rows.filter(matches).forEach((r) => {
    lines.push(cols.map(([, key]) => cell(key === 'created_at' ? fmtDate(r[key]) : key === 'status' ? STATUS[r[key]] || r[key] : r[key])).join(','));
  });
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `inquiries_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$('#refreshBtn').addEventListener('click', load);

/* ---------- 로그인 / 로그아웃 ---------- */
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#loginError');
  const btn = $('#loginBtn');
  err.hidden = true;
  btn.disabled = true;
  btn.textContent = '로그인 중...';
  const { error } = await supabase.auth.signInWithPassword({
    email: $('#email').value.trim(),
    password: $('#password').value
  });
  btn.disabled = false;
  btn.textContent = '로그인';
  if (error) {
    err.textContent = '로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.';
    err.hidden = false;
  }
});

$('#logoutBtn').addEventListener('click', () => supabase.auth.signOut());

const enter = async (session) => {
  if (!session) { show('viewLogin'); return; }
  $('#whoami').textContent = session.user.email;
  show('viewApp');
  await load();
};

/* ---------- 시작 ---------- */
if (!supabase) {
  show('viewConfig');
} else {
  supabase.auth.getSession().then(({ data }) => enter(data.session));
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') enter(session);
  });
}
