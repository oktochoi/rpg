# Chapter 1 Fun Pass Report

## 1. Before

- 제단 → 봉인 조사 → 각성 씬 → 전투 선택까지 Story Click 연속
- Guardian `activation: on_talk` + Discovery 우선순위(170) > Boss(130) → `ENTER_SCENE` 직후 Discovery로 튕김
- 자동 테스트가 `START_COMBAT RUINS_BOSS_01`로 우회
- 보스 후: 보고 → followup Next → 레온 → **여관 강제** → 길드 → 전직 (클릭 과다)
- Mainline Lv5가 경계선; 전직 전 `boostToLevel` 의존

## 2. Main Problems

- Guardian deadlock (실플레이 불가에 가까운 구간)
- 의미 없는 Story Click 체인 (followup, 여관 게이트)
- Mission 감각보다 “다음” 연타
- 자연 Lv5 / 전직 검증 부족

## 3. Flow After

```text
등록 → 숲 Mission(전투·보고) → FREE_ROAM 정비
→ 폐허 Mission(입구전 → 제단 1클릭 Reveal+Combat)
→ 사후 조사 → 귀환
→ 세리아 보고 선택 → 레온 중요 선택
→ 길드 공적(+전직)  [여관은 선택]
→ 북문 Hook
```

## 4. Removed / Merged Story Steps

| 항목 | 기존 | 변경 |
|---|---|---|
| `touch_magic_stone` / `inspect_seal_first` | ENTER_SCENE / LEARN→각성 | **START_COMBAT** (Reveal→전투) |
| `ruins_guardian_awakens` | on_talk, prio 130 | **auto**, prio `POST_BOSS_CRITICAL`(200) |
| `seria_report_followup` | 필수 Next | 메인라인 스킵(호환용 잔존) |
| report_* | → followup | **→ Leon** + `SERIA_FINAL_REPORT` |
| 여관 휴식 | 공적 인정 게이트 | **Free Roam 선택**; 길드는 Leon 후 바로 |
| `GUILD_RECOGNITION` | `EPILOGUE_REST_DONE` 필요 | `LEON_CONFRONTATION_DONE` |

## 5. Guardian Fix

- **원인:** followUp이 Discovery(170)를 Boss(130)보다 우선 + on_talk 필터
- **수정:** 제단 상호작용이 전투 시작; 각성 씬 auto + 우선순위 상향(후퇴 후 재도전용)
- **검증:** `step31-5` playChapter1이 `inspect_seal_first`만으로 COMBAT 진입 (debug START_COMBAT 없음)

## 6. Progression

| 항목 | 값 |
|---|---|
| Boss EXP | 150 → **180** |
| Forest quest EXP | 20 → **40** |
| Ruins quest EXP | 50 → **75** |
| Mainline 결과 (`M2-natural-lv5`) | **lv 7** (사이드 없이 ≥5) |
| 전직 | recognition + lv≥5 → PASS |

템포: 숲 후 Lv2~3대, 가디언·보고 후 Lv5+ (현재 시뮬은 끝까지 lv7 — 약간 여유).

## 7. Mission Flow

- **Forest:** 정찰 수락 → 전투 → 보고 → FREE_ROAM
- **Ruins:** 의뢰 → 입구전 → 제단 Combat → 조사 → 보고/레온 → 길드

## 8. Manual QA

문서: `docs/notes/CHAPTER1_MANUAL_QA.md` (체크리스트 작성 완료; 사람 손플레이는 별도)

## 9. Automated Tests

| 항목 | 결과 |
|---|---|
| step31-5 | **PASS** (M2-natural-lv5 포함) |
| step31 regression (Z) | **PASS** |
| typecheck / lint / build | 실행 |

## 10. Remaining Issues

- Mainline 종료 Lv가 7까지 오를 수 있음 → 원하면 Boss/Quest EXP 미세 하향
- 세리아 첫 만남 다층 대화는 여전히 길 수 있음 (선택 압축은 다음 패스)
- `LOCATION_DISCOVERED` 테스트 주입은 유지 (실플레이는 `forest_deeper` 경로)
- 북문/초상 에셋, Combat SFX는 P1~P2로 이월 (`CURRENT_FLOW_AND_GAPS` 백로그 갱신)

## Backlog (재정렬)

### P0 (이번 완료)

1. ~~수동 플레이 Guardian~~
2. ~~START_COMBAT 우회 제거~~
3. ~~Story Click 압축~~
4. ~~자연 Lv5~~
5. ~~Mission/여관 게이트 정리~~

### P1

- Combat Feedback / Guardian Telegraph / Minimal SFX

### P2

- Quest Log UI · 북문 BG · NPC Portrait

### P3

- Chapter 2 · Map/People/History
