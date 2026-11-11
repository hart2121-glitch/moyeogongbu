# Supabase

DB 변경은 모두 `migrations/`의 마이그레이션 파일로 기록한다. 대시보드에서 직접 테이블을 바꾸지 않는다.

## 환경 변수

앱은 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 읽는다 (`src/lib/supabase.ts`). 실제 값이 든 파일은 저장소에 올리지 않는다 (`.gitignore`가 `.env*`를 막는다).

- 개발: 루트에 `.env.development.local`을 만들고 개발 프로젝트 값, 또는 `npx supabase start`가 출력하는 로컬 값을 넣는다.
- 운영: `.env.production.local`에 운영 프로젝트 값을 넣는다.
- Vercel: 같은 이름의 환경 변수를 Preview에는 개발 프로젝트, Production에는 운영 프로젝트 값으로 넣는다.

## 로컬에서 재현하기 (Docker 필요)

```bash
npx supabase start      # 로컬 Supabase 실행, URL과 anon key를 출력
npx supabase db reset   # migrations/를 처음부터 다시 적용
npx supabase stop
```

## 새 마이그레이션

```bash
npx supabase migration new <이름>   # migrations/<시각>_<이름>.sql 생성
npx supabase db reset              # 로컬에 적용해 확인
```

## 원격 프로젝트

개발과 운영 프로젝트를 따로 둔다. 적용은 각 프로젝트에 연결한 뒤 `npx supabase db push`로 한다.

```bash
npx supabase link --project-ref <개발 프로젝트 ref>
npx supabase db push
```

테이블은 각 스토리가 필요한 만큼 마이그레이션으로 추가한다 (Story 008 범위 밖).

## 출시 전 설정 (운영 프로젝트, 한 번)

대시보드에서 하는 일이라 마이그레이션에 남지 않는다. 운영과 개발 프로젝트에 각각 한다.

1. **DB**: 운영 프로젝트에 연결하고 `npx supabase db push`. 처음이면 `migrations/`가 모두, 아니면 새 파일만 적용된다.
2. **Google 로그인** (Authentication > Sign In / Providers > Google): Google Cloud 콘솔에서 만든 OAuth 클라이언트 ID와 비밀번호를 넣는다. Google 쪽 "승인된 리디렉션 URI"에는 Supabase가 보여 주는 콜백 주소(`https://<프로젝트 ref>.supabase.co/auth/v1/callback`)를 넣는다.
3. **돌아올 주소** (Authentication > URL Configuration):
   - Site URL: 운영 주소 (예: `https://<배포 도메인>`)
   - Redirect URLs: `https://<배포 도메인>/**`. 개발 프로젝트에는 Vercel 미리보기 주소(`https://*-<팀 이름>.vercel.app/**`)와 `http://localhost:5173/**`도 넣는다.
   - 앱은 로그인을 마치면 `/lobby`로 돌아온다 (`src/features/account/viewmodel/useAccount.ts`).
4. **Vercel 환경 변수**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 Production에는 운영, Preview에는 개발 프로젝트 값으로. 바꾼 뒤에는 다시 배포해야 반영된다 (빌드할 때 박힌다).
5. **확인**: 운영 주소에서 로그인, 화면 이름 정하기, 회사 방 만들기, 앉기, 퇴근 정산, 카페 입장까지 한 번 해 본다.

공지는 운영에서 `public.notices`에 행을 더해 올린다 (서비스 키, SQL 편집기). 로비는 최근 네 개를 보여 준다.
