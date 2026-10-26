# 현재 상태 (CURRENT_STATE)

> 기준: 2026-10-16  
> 역할: **지금 게임이 어떤 상태인지**만 적는다.  
> 짝 문서: `docs/CHANGED.md` · `docs/TODO_NEXT.md`

---

## 1. 한 줄

**Chapter 1은 `VILLAGE` ↔ `ADVENTURE` ↔ `COMBAT` 페이즈의 스토리 중심 액션 RPG.**  
마을은 모험 사이 정비 구간이고, 모험 중에는 미션 선택지만 진행한다.  
자동 검증: `game-phase` / `step31` / `step31-5` / `step22` / `ruins-key-hunt` / `progression-check` **PASS**.

---

## 2. GamePhase

```ts
type GamePhase = 'VILLAGE' | 'ADVENTURE' | 'COMBAT';
```

| Phase | 가능 | 불가 |
| --- | --- | --- |
| **VILLAGE** | 길드·상점·여관·훈련장·NPC·강화·다음 모험 출발 | — |
| **ADVENTURE** | 현재 스토리·미션 탐색·전투·제작 선택지 | 마을 귀환(미션 완료 전)·상점·여관·사이드·AI 자유대화 |
| **COMBAT** | Phaser 전투 | 종료 후 **ADVENTURE**로 복귀 (마을 직행 아님) |

미션이 완전히 끝나면 `ADVENTURE` → `VILLAGE` 자동 귀환.

---

## 3. Chapter 1 흐름

```text
루엔 [VILLAGE]
  ↓ 모험 출발
숲 정찰 [ADVENTURE] → 전투 → 푸른 흔적 → 자동 귀환
루엔 [VILLAGE]  길드 / 전직 / 상점 / 여관
  ↓
숲 열쇠 사냥 [ADVENTURE] → Encounter → 열쇠 → 자동 귀환
루엔 [VILLAGE]  강화 / 회복
  ↓
폐허 [ADVENTURE] → 입구전 → 봉인 → Guardian [COMBAT]
  → 후속 스토리 → 자동 귀환
루엔 → 북문 Hook → Chapter 1 종료
```

---

## 4. 훈련장 (VILLAGE)

- 1차 전직 후 해금
- Phaser 전투 재사용 + `training` 모디파이어 (허수아비 3, 무한 자원, 보상/퀘스트 영향 없음)
- `[훈련 종료]` → VILLAGE 복귀 (PlayerState 영구 변경 없음)
- 전직 직후 안내 씬 (`luen_class_chosen`) — 강제 이동 아님

## 5. UI

- `HubLocationNav`: **VILLAGE**일 때만 표시
- `ADVENTURE`: 미션 진행 선택지 위주 (전투·다음 구간 이동). dead-end `계속`/LOOK_AROUND만 남지 않음
- 자유 입력 UI 제거, 모험 중 `FREE_ACTION` 거부

---

## 6. 검증

| 항목 | 결과 |
| --- | --- |
| game-phase / training-ground / step31 / 31-5 / quest / key-hunt / progression | PASS |
| `npx tsc --noEmit` / `npm run build` | OK |

상세 TODO: `docs/TODO_NEXT.md`
