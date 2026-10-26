# Chapter 1 Manual QA

수동 플레이 검증용. Debug shortcut 없이 진행한다.

## Phase Flow (필수)

```text
VILLAGE → ADVENTURE → COMBAT → ADVENTURE → Mission Complete → VILLAGE
```

- [ ] 루엔에서만 길드/상점/여관/강화 메뉴가 보인다
- [ ] 숲·폐허 모험 중 **마을 이동 메뉴가 숨겨진다**
- [ ] 모험 중 상점·여관·자유대화가 안 된다
- [ ] 전투 후 마을로 튕기지 않고 **같은 모험**으로 이어진다
- [ ] 미션 완료 시에만 **자동으로 루엔**에 돌아온다

## Flow Check

- [ ] 시작 후 3분 내 첫 전투 (길드 등록 → 숲 → 정찰전)
- [ ] 길드 등록 정상
- [ ] 숲 정찰 Adventure 시작 (마을 메뉴 숨김)
- [ ] 고블린 전투 → 푸른 흔적 → **자동 귀환**
- [ ] 루엔에서 전직 / 상점 / 여관 정비 가능
- [ ] 다음 모험: 열쇠 사냥 Adventure
- [ ] 숲 Encounter 중 열쇠 획득 → **자동 귀환**
- [ ] 루엔 정비 후 폐허 출발
- [ ] 입구 전투 → 봉인 조사 → Guardian Combat
- [ ] 보스 격파 → 후속 → **자동 귀환**
- [ ] 세리아 보고 → 레온 → 길드 공적 → 북문 Hook
- [ ] Chapter 완료

## Training Ground

- [ ] 전직 전에는 훈련장 이동이 막힌다
- [ ] 전직 직후 안내 문구가 한 번 보인다 (강제 이동 아님)
- [ ] 훈련장에서 허수아비 상대로 기본 공격·스킬·이동·회피가 된다
- [ ] 마나/HP/아이템이 실제 캐릭터에 손해 주지 않는다
- [ ] `[훈련 종료]`로 마을(VILLAGE)로 돌아온다
- [ ] 모험(ADVENTURE) 중에는 훈련장을 쓸 수 없다

## Choice Check

- [ ] 모험 중 선택지가 대체로 `계속 이동 / 흔적 조사 / 전투` 수준으로 짧다
- [ ] “스토리를 할지 말지” 선택지가 없다
- [ ] 중요한 분기(보고 내용·레온 등)에서만 여러 선택지가 있다

## Regression Scripts

```bash
npx tsx scripts/game-phase-check.ts
npx tsx scripts/training-ground-check.ts
npx tsx scripts/step31-flow-check.ts
npx tsx scripts/step31-5-flow-check.ts
npx tsx scripts/ruins-key-hunt-check.ts
npx tsx scripts/step22-quest-check.ts
npx tsx scripts/progression-check.ts
```
