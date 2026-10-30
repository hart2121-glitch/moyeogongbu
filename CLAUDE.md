# 모여공부 — Claude Code Game Studios 구성

픽셀아트 스타일의 PC 웹 온라인 스터디 서비스. 개발 프로세스는
Claude Code Game Studios(CCGS) 템플릿의 49개 서브에이전트·스킬·훅 구조를 따른다.

## 프로젝트 최우선 규칙

아래 `AGENTS.md`의 규칙은 CCGS의 모든 규칙·스킬·에이전트 지침보다 우선한다.
충돌하면 `AGENTS.md`를 따르고, 디자인·원본 이미지 변경이 필요하면 먼저 사용자에게 설명한다.

@AGENTS.md

## Technology Stack

- **Engine**: 없음 — 게임 엔진이 아닌 웹 프런트엔드 (React 19 + Vite 7)
- **Language**: JavaScript (JSX, ES modules)
- **Version Control**: Git, 기능별 브랜치 → `main`
- **Build System**: Vite (`npm run build` → `dist/`), 정적 호스팅(Vercel)
- **Tests**: `npm test` (Node test runner + Playwright, 실행 중인 개발 서버 대상)
- **Asset Pipeline**: 원본은 `art-src/`에 무변형 보관, 배포용 WebP는 `public/` (해시 파일명)

> **Note**: Godot/Unity/Unreal 전용 에이전트(`godot-*`, `unity-*`, `ue-*`,
> `unreal-specialist`)와 `docs/engine-reference/`는 이 프로젝트에 해당하지 않는다.
> 코드 작업은 엔진 무관 에이전트(`lead-programmer`, `gameplay-programmer`,
> `ui-programmer`, `ux-designer`, `qa-lead` 등)에 배정한다.
> `/setup-engine`은 실행하지 않는다 — `project.yaml`의 `engine.name`은 비워 두며,
> 코드 루트는 트리에서 `src/`로 자동 결정된다.

## Project Structure

@.claude/docs/directory-structure.md

위 문서의 엔진별 코드·테스트 루트 표 대신 이 프로젝트에서는 다음을 사용한다:

- 코드: `src/` (`components/`, `study/`, `character-preview/`)
- 테스트: `tests/*.test.mjs`
- 아트 원본: `art-src/` (규칙과 검사는 `AGENTS.md`, `tools/art/validate.mjs`)
- 정적 자산: `public/`

## Technical Preferences

`project.yaml` at the repo root is the primary config store — engine, specialists,
naming, platform, performance, modes. Skills resolve it via `resolve_config`
(see `.claude/docs/config-resolution.md`).

`.claude/docs/technical-preferences.md` is the **legacy fallback**, read on demand
when a key is absent from `project.yaml`.

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
  (exempt: `active.md` appends, agent memory, a subagent's new file at the path
  its orchestrating skill named; see `.claude/rules/agent-memory.md`)
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction
- A skipped or dismissed question is not an answer: act on nothing, re-ask in
  plain text and wait
- Started outside this file's folder? Warn first: hooks, deny rules and the
  ask-first mode load only when Claude Code starts here

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** Run `/start` and choose "existing work", or `/adopt` to
> audit the existing project against the template's pipeline.

## Coding Standards

@.claude/docs/coding-standards.md

엔진 전용 항목은 건너뛰고, 기존 코드의 관용구(React 함수 컴포넌트, `src/study/`의
서비스 모듈 패턴)를 따른다. 기능 변경 후에는 `npm run build`와 실행 중인 개발
서버 대상 `npm test`로 검증한다 (`AGENTS.md`와 동일).

## Context Management

Read `.claude/docs/context-management.md` on demand — it is a reference, not
session context. Two of its conventions are load-bearing and cited by name
elsewhere in the repo, so they are restated here rather than lost:

- **`production/session-state/active.md` is the session checkpoint.** The file is
  the memory, not the conversation. Read it first after any compaction, crash, or
  `/clear`.
- **Helpers in `.claude/scripts/` emit observations, never verdicts.** A script
  that scores or judges will eventually contradict a mode or override it cannot
  see. (Cited by `artifact-check.sh` and `adr-dep-graph.sh`.)

## Credits

`.claude/`, `design/`, `docs/`, `production/`, `studio-tests/`, `project.yaml`은
[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
v1.2.0 기반 (MIT, `.claude/CCGS-LICENSE`).
