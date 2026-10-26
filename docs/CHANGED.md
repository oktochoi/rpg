# 최근 변경 (CHANGED)

> 기준: 2026-10-16 GamePhase 리팩터  
> 역할: **이번에 뭐가 바뀌었는지**만 적는다.  
> 짝 문서: `docs/CURRENT_STATE.md` · `docs/TODO_NEXT.md`

---

## 2026-10-16 — 훈련장 (Training Ground)

- 루엔 허브에 `luen_training_ground` 추가 (VILLAGE · 1차 전직 후)
- Phaser Combat `training` 모디파이어: 허수아비 3 / 무한 MP·무피해 / EXP·Gold·Loot·Quest 없음
- 전직 직후 안내 씬 + `[훈련 종료]`로 VILLAGE 복귀
- 검증: `scripts/training-ground-check.ts`

---

## 2026-10-16 — GamePhase (VILLAGE / ADVENTURE / COMBAT)

### 방향

- 자유도를 줄이고 **스토리 중심 액션 RPG** 흐름으로 고정
- 마을 = 모험 사이 정비 / 모험 = 미션이 끝날 때까지 잠금
- Chapter 1만 적용 (Chapter 2 미변경)
- 기존 GameState / Command / Event / Scene / Quest / Encounter 재사용

### 기계

| 변경 | 내용 |
| --- | --- |
| `GamePhase` | `getGamePhase` · `ADVENTURE_STARTED` / `ADVENTURE_ENDED` |
| 허브 이동 | 마을 건물 ↔ 숲 출발 라우팅 / `HubLocationNav`는 VILLAGE만 |
| 모험 잠금 | 모험 중 마을·상점·여관·자유대화 차단 |
| 자동 귀환 | 정찰(푸른 흔적) · 열쇠 획득 · 가디언 후속 → 루엔 |
| 전투 복귀 | COMBAT 종료 → ADVENTURE (미션 완료 시에만 VILLAGE) |
| 선택지 | 모험 중 미션 중심 3개 내외로 정리 |

### 테스트

- `scripts/game-phase-check.ts` 추가
- step31 / 31-5 / quest / ruins-key-hunt / progression PASS

---

## 이전 (2026-09-27 Gameplay Rework 요약)

- Ch1 계속 진행 / 여관 선택 휴식 / 열쇠는 백그라운드 게이트
