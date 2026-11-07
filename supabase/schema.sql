-- 문의 저장·관리용 스키마. Supabase 대시보드 → SQL Editor 에서 실행하세요.
-- 관리자 이메일을 바꾸려면 아래 'admin_emails' 부분(3곳)을 같은 값으로 수정하세요.

-- 1) 테이블
create table if not exists public.inquiries (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  school      text,
  name        text not null,
  phone       text not null,
  email       text,
  interest    text not null,
  message     text not null,
  consent     boolean not null default false,
  status      text not null default 'new'
);

alter table public.inquiries enable row level security;

-- 2) 권한: 방문자(anon)는 입력만, 로그인한 관리자(authenticated)는 조회·수정·삭제
grant insert on public.inquiries to anon;
grant select, update, delete on public.inquiries to authenticated;

-- 3) 정책 (RLS)
drop policy if exists "anyone can insert" on public.inquiries;
create policy "anyone can insert"
  on public.inquiries for insert
  to anon
  with check (consent = true);

drop policy if exists "admin can read" on public.inquiries;
create policy "admin can read"
  on public.inquiries for select
  to authenticated
  using ((auth.jwt() ->> 'email') in ('dlaehd1234@naver.com'));           -- admin_emails

drop policy if exists "admin can update" on public.inquiries;
create policy "admin can update"
  on public.inquiries for update
  to authenticated
  using ((auth.jwt() ->> 'email') in ('dlaehd1234@naver.com'))             -- admin_emails
  with check ((auth.jwt() ->> 'email') in ('dlaehd1234@naver.com'));       -- admin_emails

drop policy if exists "admin can delete" on public.inquiries;
create policy "admin can delete"
  on public.inquiries for delete
  to authenticated
  using ((auth.jwt() ->> 'email') in ('dlaehd1234@naver.com'));            -- admin_emails
