# Progression Refactor Plan

## Execution Checklist

- [x] 반복 조사 EXP 차단
- [x] 최초 Fact 보상 구현
- [x] Encounter 최초 클리어 추적
- [x] 반복 전투 EXP 제한
- [x] Story Milestone reward 구현
- [x] Quest reward 중복 방지
- [x] Shop unlock 조건 구현/확인
- [x] Save/Load 반영
- [x] UI reward feedback 개선
- [x] Typecheck
- [x] Lint
- [x] Build
- [x] Gameplay flow 검증 (`scripts/progression-check.ts`)

---

## Current Reward Flow (pre-fix)

### EXP
- `action-rewards.ts` `eventsForTurnRewards` — `REPEAT_EXP = 1`로 동일 행동 무한 EXP
- `progression-rules.ts` Combat — sourceId에 `turn` 포함 시 재도전 풀 EXP 위험
- Fact/Quest/Chapter — `processedExpSourceIds`로 대체로 1회

### Gold
- Combat reward sourceId에 turn 포함 → 재도전 시 풀 Gold 반복 가능했음

### Exploration / Combat / Story / Shop / Save
(분석 내용은 git history / 이전 섹션 참고. 구현 후 상태는 Completion Report 참고.)

## Target (applied)

```text
새 Fact / First Encounter / Quest / Milestone → 큰 EXP
반복 행동 / 재도전 → EXP 0, (전투만) Gold 소량
```
