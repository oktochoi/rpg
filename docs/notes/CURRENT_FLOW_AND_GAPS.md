# 현재 플로우 · 부족한 부분 정리

> 기준일: 2026-09-25  
> 범위: Chapter 1 플레이어블 루프 + Progression + 에셋/모듈 갭  
> 관련: `docs/plans/CURSOR_STORY_REFACTOR_CHECKLIST.md`, `docs/design/ASSETS.md`, `docs/plans/PROGRESSION_REFACTOR_PLAN.md`

---

## 1. 한 줄 요약

**Action RPG(전투·성장 중심) + Chapter 1 스토리(~20–30%).**  
성장은 반복 그라인드가 아니라 **최초 발견 / 최초 클리어 / 퀘스트 / 마일스톤**에서 온다.  
Chapter 1 자동 플레이(`step31` / `step31-5`)는 통과 상태.

---

## 2. Chapter 1 인과 플로우 (스토리)

```text
루엔 도착 · 길드 등록
        ↓
숲 고블린 이상 이동 (정찰 전투)
        ↓
푸른 마력 흔적 → 세리아 폐허 의뢰
        ↓
폐허 입구 전투 → 제단/왕실 봉인 조사
        ↓
봉인은 이미 훼손됨 → Guardian 각성·격파
        ↓
세리아 보고 → 레온 대치 (관점 분기)
        ↓
여관 휴식 → 길드 공적 인정 → 1차 전직
        ↓
북문 긴급 보고 (Chapter 2 Hook)
```

### 중심 질문 (Ch1에서 답하지 않음)

> 누가 루엔의 왕실 봉인을 최근에 건드렸는가?

### Sequence 구조 (`src/game/story/sequences/chapter1-sequences.ts`)

| Sequence | 제목 | 핵심 씬 |
| --- | --- | --- |
| `seq_ch1_luen_arrival` | 루엔 도착 | Intro → 광장/길묻기 → 길드 등록 → 첫 의뢰 |
| `seq_ch1_forest_scout` | 숲 정찰 | 숲길·흔적·정찰/매복 전투 → 길드 보고 |
| `seq_ch1_seria_ruins` | 세리아와 폐허 | 레온/세리아 첫 만남 → 폐허 의뢰 |
| `seq_ch1_ruins` | 폐허 | 발견·게이트·제단·Guardian → 탈출·귀환 |
| `seq_ch1_finale` | 제1장 마무리 | 보고·레온·여관·공적·전직·북문 Hook·챕터 완료 |

허브(마을/여관/길드/상점/숲/폐허/북문)는 시퀀스 사이에 **FREE_ROAM**으로 열리며, 상점·강화 루프를 막지 않는다.

---

## 3. 권장 플레이어 경로 (실행 플로우)

자동 테스트(`playChapter1`)와 맞춘 **권장 수동 플레이** 순서.

### A. 도착 · 등록

1. 마을 Intro (`intro_continue`) → 허브
2. 모험가 길드 → `register_adventurer`
3. 고블린 정찰 퀘스트 수락 (`FOREST_GOBLIN_SCOUR`)

### B. 숲 정찰

4. 숲길 이동 → `CH1_FOREST_SCOUTS` (또는 동등 encounter) 클리어
5. 길드 복귀 · 도란 보고
6. (선택) 상점/여관 정비

### C. 폐허 의뢰

7. 정찰 보고 완료 시 `RUINS_MYSTERY` AVAILABLE → 세리아 수락 후 **숲길 → 폐허로 가 싸운다**  
   - 폐허 `discoveryRequired` 해제: 메인 전투 경로 softlock 없음. 입장 시 자동 발견.
8. 마을/길드/상점/여관은 **허브 타임에 항상 이동·상점 가능** (시퀀스 잠금과 무관)
9. 고대 폐허 진입 → 입구 전투

### D. 폐허 · 보스

10. 입구 전투 `CH1_RUINS_GATE` 클리어
11. 제단 조사 → `inspect_seal_first` → `touch_magic_stone`
12. Guardian 전투 `RUINS_BOSS_01`  
    - 씬 진입(`ENTER_SCENE` / `fight_guardian`)이 막히면 **직접 `START_COMBAT`** 이 Action RPG 경로
13. 코어 조사 `investigate_guardian_core` → 숲 → 마을

### E. 피날레

14. `report_ruins` → `report_all` → `seria_follow_done` → `leon_agree_seria` (또는 보고/유보 분기)
15. 푸른 달 여관 → 휴식 (`EPILOGUE_REST_DONE`)
16. **여관 → 마을 → 길드** (여관↔길드 직행 불가)
17. `GUILD_RECOGNITION` onEnter → `GUILD_RECOGNITION_DONE`
18. lv5 + 위 플래그 → 1차 전직 (검사/마법사/도적)
19. 북문 → Hook 씬 → Chapter 1 완료 조건 충족

### 전직 게이트 (`canChooseFirstAdvancement`)

다음을 **모두** 만족해야 함:

- class = 모험가
- level ≥ 5
- `RUINS_MYSTERY` COMPLETED
- `RUINS_GUARDIAN_DEFEATED`
- `GUILD_RECOGNITION_DONE`
- `FIRST_ADVANCEMENT_DONE` 아님

### Chapter 완료 조건 (`canCompleteChapter`)

- 메인 퀘스트 완료 + Guardian 격파 + 세리아 최종 보고  
- 길드 공적 + 1차 전직 + 북문 Hook 확인  
→ `NORTHERN_GATE_OPEN` 등 후속 플래그 설정

---

## 4. Progression (성장) 플로우

| 소스 | EXP | Gold |
| --- | --- | --- |
| 신규 Fact / 최초 조사 | 있음 | — |
| Encounter **최초** 클리어 | 풀 EXP | 풀 Gold |
| Encounter **재도전** | 0 | 소량 |
| 반복 LOOK/INVESTIGATE 등 | **0** | — |
| Quest / Story Milestone | 1회 (`processedExpSourceIds` / reward ids) | 설정대로 |
| 상점 강화 언락 | 플래그/팩트 조건 | 골드 소모 |

검증: `scripts/progression-check.ts`, `step31-5` G-repeat.

---

## 5. 지역 · 이동

| 지역 | 비고 |
| --- | --- |
| 루엔 마을 | 허브 |
| 푸른 달 여관 | 휴식 전용 위치, 마을과만 연결 |
| 모험가 길드 | 등록·보고·전직 |
| 잡화점 | 강화/상점 (배경은 마을 이미지 재사용) |
| 숲길 | 정찰·매복 |
| 고대 폐허 | discovery 필요 |
| 북문 | Ch1 Hook / Ch2 입구 |

`STORY_LOCKED` 중에도 **허브 이동 + 메인 퀘스트 목적지(숲/폐허)** 는 허용.

---

## 6. 전투 Encounter (Ch1)

| ID | 역할 |
| --- | --- |
| `CH1_FOREST_SCOUTS` | 첫 정찰 |
| `CH1_FOREST_AMBUSH` | 숲 추가 |
| `CH1_GOBLIN_CAMP` 등 | 사이드/확장 |
| `CH1_RUINS_GATE` | 폐허 입구 |
| `RUINS_BOSS_01` | Ruins Guardian |

재클리어 가능(재도전 EXP 0).

---

## 7. 부족한 이미지 · 오디오

상세 표는 `docs/design/ASSETS.md`와 동기. 아래는 **우선 채워야 할 갭**.

### 7.1 스토리 배경

| 위치 | 상태 | 비고 |
| --- | --- | --- |
| 루엔 / 여관 / 길드 / 숲 / 폐허 | PRESENT | `public/assets/story` + `game-assets/backgrounds` |
| **북문** `northern_gate.png` | **MISSING** | 레지스트리 경로만 있고 파일 없음 → CSS 테마 fallback |
| 잡화점 | 마을 배경 **재사용** | 전용 인테리어 없음 |

### 7.2 NPC 초상

| NPC | 상태 |
| --- | --- |
| 세리아 / 레온 / 마르타 | PRESENT (neutral만) |
| **감정 변형** (`*_curiosity` 등) | **MISSING** — 대화 UI는 letter/neutral fallback |
| **상점 주인 엘린** `shopkeeper_elin_placeholder.png` | **MISSING** |
| **길드장 도란** 전용 포트레이트 | **MISSING** (대화 시 플레이스홀더 글자) |

### 7.3 전투 이펙트 · 투사체

| 에셋 | 상태 |
| --- | --- |
| slash / frost / shadow / magic_bolt / fireball | PRESENT |
| `enemy_arrow.png` | **MISSING** → placeholder |
| `boss_arcane_bolt.png` | **MISSING** → placeholder |
| Guardian charge / phase2 전용 스프라이트 | **MISSING** → tint·모션 fallback |
| `guard_shield` / `boss_slam` / `boss_charge` / `boss_phase` | **MISSING** → Graphics |

### 7.4 오디오 (`public/game-assets/audio/`)

**BGM·SFX 전부 MISSING.**  
레지스트리만 있고 파일 없음 → `AudioManager` no-op.  
우선순위 제안:

1. UI click/confirm + combat_start / victory / defeat  
2. story_safe / combat_normal / combat_boss  
3. 직업·보스 스킬 SFX

---

## 8. 부족한 모듈 · UI · 콘텐츠

### 8.1 UI 플레이스홀더 (골격만)

| 패널 | 파일 | 상태 |
| --- | --- | --- |
| 지도 | `LocationMap.tsx` | placeholder 섹션 |
| 퀘스트 로그 | `QuestLog.tsx` | placeholder |
| 인물 | `PeoplePanel.tsx` | placeholder |
| 기록 | `HistoryPanel.tsx` | placeholder |
| 설정 | `StoryScreen.tsx` 내 | placeholder |

→ 스토리 메인(`StoryPanel` / `ChoicePanel` / `HubLocationNav`)은 동작. **사이드 패널 실데이터 바인딩**이 남음.

### 8.2 Chapter 2~4

| 장 | 정의 | 플레이어블 씬/시퀀스 |
| --- | --- | --- |
| Ch1 | 완료 수준 | Sequence + Beat + 자동 테스트 PASS |
| Ch2 북문의 그림자 | 메타만 (`chapter-definitions`) | **미구현** (`KNIGHT_SUSPICION` 퀘스트 stub 수준) |
| Ch3 왕도의 균열 | 메타만 | **미구현** (mainQuestIds 빈 배열) |
| Ch4 봉인의 진실 | 메타만 | **미구현** |

의도적으로 Ch2~4 세부는 확장하지 않음(체크리스트). **다음 대형 작업** 후보.

### 8.3 시스템적으로 “동작하지만 얇은” 부분

| 영역 | 현황 | 할 일 |
| --- | --- | --- |
| LLM / Groq 대화 | 컨텍스트·mock·키 없으면 fallback | 실서비스 키·프롬프트 튜닝은 범위 외였음 |
| FreeAction | 명령 존재, EXP는 그라인드 0에 가깝게 | UX/카피 정리 |
| 사이드 퀘스트 | 약초·마르타 짐·레온 감시 등 정의 있음 | 플레이 폴리시·보상 밸런스 재확인 |
| 보스 씬 게이트 | 자동 플레이는 `START_COMBAT`로 우회 | 수동 플레이에서 `fight_guardian` 노출·activation 안정화 |
| 여관 첫 방문 | 마르타 씬에 REST 추가됨 | 감정 선택 → 허브 전환 UX 다듬기 |
| 에셋 이중 경로 | `public/assets` vs `public/game-assets` | 단일 런타임 경로로 정리 권장 |

### 8.4 검증 상태

| 스위트 | 상태 |
| --- | --- |
| `step31-5-flow-check` | PASS (회귀 step31 포함) |
| `progression-check` | PASS |
| typecheck / lint / build | 최근 PASS (lint warning만) |

---

## 9. 우선순위 백로그 (추천)

### P0 — Fun Pass (완료 · 2026-09-25)

1. ~~Chapter 1 수동 플레이 / Guardian 우회 제거~~ → `docs/notes/CHAPTER1_FUN_PASS_REPORT.md`
2. ~~반복 Story Click 압축 / 여관 게이트 해제~~
3. ~~자연 Level 5 / 전직~~

### P1 — 전투 체감

4. Hit / 피격 / 회피 Feedback
5. Guardian Telegraph
6. Combat Start / Hit / Victory SFX (최소)

### P2 — 폴리시 아트·UI

7. 퀘스트 로그 GameState 연동
8. 북문 배경 PNG
9. 도란 / 엘린 초상
10. 잡화점 전용 배경

### P3 — 확장

11. Chapter 2 시퀀스
12. History / People / Map / Settings 패널
13. NPC 감정 포트레이트 세트
14. 에셋 경로 `game-assets` 통일

---

## 10. 핵심 파일 인덱스

| 목적 | 경로 |
| --- | --- |
| Ch1 Sequence | `src/game/story/sequences/chapter1-sequences.ts` |
| Beat 순서 | `src/game/story/scenes/chapter1/beat-order.ts` |
| 씬 정의 | `src/game/story/story-scene-definitions.ts` |
| 목표 문구 | `src/game/story/chapters/main-objective.ts` |
| 전직 게이트 | `src/game/player/classes/first-advancement.ts` |
| 이동 규칙 | `src/game/world/locations/location-rules.ts` |
| Progression | `src/game/player/progression/` |
| 비주얼 레지스트리 | `src/game/combat/visual/asset-registry.ts` |
| 오디오 레지스트리 | `src/game/audio/audio-registry.ts` |
| 플로우 테스트 | `src/game/app-flow/step31-5-scenarios.ts`, `step31-scenarios.ts` |

---

## 11. 현재 “완료”로 봐도 되는 것

- [x] Chapter 1 인과 · Sequence · Beat  
- [x] 최초 보상 Progression (반복 EXP 차단)  
- [x] 길드→숲→폐허→보스→보고→전직→북문 자동 플레이  
- [x] 플레이어/적/보스 기본 전투 스프라이트  
- [x] 주요 지역 배경 5종 + 핵심 NPC 3종 neutral  

## 12. “아직 없음”으로 봐야 하는 것

- [ ] 북문·잡화점 전용 아트, 도란/엘린 초상, NPC 감정셋  
- [ ] 전투 투사체·보스 페이즈 전용 비주얼 일부  
- [ ] 오디오 전부  
- [ ] 지도/인물/기록/설정/퀘스트로그 UI 실구현  
- [ ] Chapter 2+ 플레이어블 콘텐츠  
