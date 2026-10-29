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
