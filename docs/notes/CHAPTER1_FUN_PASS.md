# Chapter 1 Fun Pass — 현재 흐름 · 클릭 체인 · Debug Shortcuts

> 작성: 2026-09-25 · Fun Pass 실행 전 분석 스냅샷  
> 코드 기준: `story-scene-definitions`, `chapter1-sequences`, `step31-5 playChapter1`

---

## 1. Before — 수동 플레이 클릭 체인

레이블: **PC** PlayerControl · **SC** StoryClick · **CB** Combat · **FR** FreeRoam

### Mission 0 — 도착 (목표: 첫 전투까지 단축)

| # | Type | 단계 | 상태 변화? | 의미 있는 선택? |
|---|---|---|---|---|
| 1 | SC | `luen_village_intro` → `intro_continue` | 허브 진입 | 아니오 (계속) |
| 2 | FR/PC | 길드로 이동 | 위치 | 예 |
| 3 | SC | `register_adventurer` | `guild_registered` | 약함 (역할 RP) |
| 4 | SC | 정찰 퀘스트 수락 | quest ACTIVE | 예 |

→ 첫 Combat까지 SC 약 2~3회 (양호).

### Mission 1 — 숲 정찰

| # | Type | 단계 |
|---|---|---|
| 5 | PC | 숲 이동 |
| 6 | SC | 전투 선택 |
| 7 | **CB** | `CH1_FOREST_SCOUTS` |
| 8 | SC×0~N | 전투 후 흔적 조사 (선택) |
| 9 | PC | 길드 귀환 |
| 10 | SC | 도란 보고 · 퀘스트 완료 |
| — | FR | 상점/여관 가능 |

### Mission 2 — 폐허

| # | Type | 단계 |
|---|---|---|
| 11 | FR/SC | 세리아 의뢰 (다층 대화 가능) |
| 12 | PC | 숲 → (발견) → 폐허 |
| 13 | SC+CB | 입구 `CH1_RUINS_GATE` |
| 14 | SC | `investigate_altar` |
| 15 | SC | `inspect_seal_first` / `touch_magic_stone` |
| 16 | SC | `fight_ruins_guardian` (**자주 실패 → 교착**) |
| 17 | **CB** | `RUINS_BOSS_01` |

**클릭 체인 (개선 후보):** 제단→조사→각성→전투 = SC 3연속 + activation 버그.

### Finale — 보스 이후 (과다 SC)

| # | Type | 단계 |
|---|---|---|
| 18 | SC | core 조사 |
| 19 | SC | aftermath → 숲 이동만 |
| 20 | SC | forest_return → 마을 |
| 21 | SC | report_ruins |
| 22 | SC | report_all |
| 23 | SC | seria_follow_done (**의미 약한 Next**) |
| 24 | SC | leon_agree_* (**유의미**) |
| 25 | PC | 여관 |
| 26 | SC | 휴식 (**플래그 게이트용**) |
| 27 | PC | 마을→길드 |
| 28 | auto | guild_recognition |
| 29 | SC | 전직 |
| 30 | PC | 북문 Hook |

**연속 SC 6~8회** — Fun Pass 최우선 압축 대상.

---

## 2. 클릭 체인 탐지 요약

| 구간 | 연속 SC | 판정 |
|---|---|---|
| Intro→등록 | 2~3 | OK |
| 숲 미션 | SC 사이에 Combat | OK |
| 제단→가디언 | 3 + deadlock | **MUST FIX** |
| 보고→레온→여관 | 6+ | **MUST COMPRESS** |
| 길드 공적→전직 | 1~2 | 경미 |

---

## 3. Debug Shortcuts (`playChapter1`)

| Shortcut | 분류 | 비고 |
|---|---|---|
| `START_COMBAT` + `RESOLVE_COMBAT` (일반 encounter) | 테스트 전용 유지 | Phaser 생략 |
| **`START_COMBAT RUINS_BOSS_01` 우회** | **실플레이 버그 은폐** | Fun Pass에서 제거 목표 |
| `LOCATION_DISCOVERED ancient_ruins` 주입 | 테스트 전용 유지 | deeper 씬 생략 |
| `RECORD_DIALOGUE` + `ACCEPT_QUEST` | 테스트 전용 유지 | 세리아 다층 스킵 |
| `boostToLevel` / EXP grant (N/O/P/Q) | Unit 테스트용 | Play Flow와 분리 |
| WorldFlag 직접 set (step34 일부) | Unit | Play Flow 금지 |

---

## 4. Guardian Deadlock 원인

1. `ruins_guardian_awakens` `activation: 'on_talk'`
2. Discovery 우선순위 **170** > Guardian **130**
3. `ENTER_SCENE` 직후 `followUpSceneEvents`가 Discovery로 재해석 → 각성 씬에서 튕김
4. `fight_guardian` 미노출 → 테스트가 `START_COMBAT` 우회

---

## 5. 여관 휴식

- `GUILD_RECOGNITION`이 `EPILOGUE_REST_DONE` 요구
- 휴식은 HP 회복 기능은 있음, 메인 게이트로는 **과함**
- Fun Pass: 공적 인정은 `LEON_CONFRONTATION_DONE`만 요구, 여관은 Free Roam 선택

---

## 6. Level 5 (Before 추정)

누적 ~410 필요. Mainline(필수 encounter+quest+마일스톤 일부)은 **가디언 직후 Lv4~5 경계**.  
Fun Pass에서 Boss/Quest EXP 소폭 상향으로 **가디언 격파 후 자연 Lv5**.

권장 템포: 숲 완료 Lv2~3 · 폐허 중 Lv3~4 · Guardian 후 Lv5.

---

---

## 8. After (Fun Pass 적용 후)

상세 보고: [`CHAPTER1_FUN_PASS_REPORT.md`](./CHAPTER1_FUN_PASS_REPORT.md)  
수동 QA: [`CHAPTER1_MANUAL_QA.md`](./CHAPTER1_MANUAL_QA.md)

```text
제단 상호작용 → Combat (우회 없음)
보고 선택 → 레온 중요 선택
레온 후 → 길드 공적/전직 (여관 선택)
Mainline → 자연 Lv≥5
```
