# AI RPG — Game Design

## 1. Game Concept

싱글 플레이 AI 기반 RPG.

플레이어는 동일한 세계관에서 게임을 시작하지만:

* 직업
* 행동
* NPC 관계
* 선택
* 전투 결과
* 알고 있는 정보

에 따라 서로 다른 이야기를 경험한다.

---

# 2. Core Experience

게임의 핵심은 다음 세 가지다.

### 자유로운 이야기

플레이어는 정해진 선택지만 사용하는 것이 아니라 직접 행동을 입력할 수 있다.

### 살아있는 NPC

NPC는:

* 각자의 성격
* 목표
* 지식
* 관계
* 제한된 기억

을 가진다.

### 직접 조작하는 전투

스토리만 읽는 게임이 아니라 중요한 상황에서는 직접 캐릭터를 조작하여 싸운다.

---

# 3. Main Gameplay Loop

```text
PLAYER CHOICE
 ↓
Action Validation
 ↓
Action Resolution
 ↓
Domain Events
 ↓
Game Time Advance
 ↓
Action EXP Reward
 ↓
Level Up Check
 ↓
Quest / Knowledge / Relationship / Memory
 ↓
Story Resolver
 ↓
Dynamic Choice
```

---

# 4. Player

초기 직업:

```text
ADVENTURER (모험가)
```

모든 New Game Player는 Lv.1 모험가로 시작한다. Character Creation에서는 이름만 정한다.

성장:

```text
Lv1~4   모험가
Lv5     검사 / 마법사 / 도적 선택 (제1장 완료 후)
Lv10    상급 검사 / 상급 마법사 / 그림자 도적
Lv20    소드마스터 / 대마법사 / 암살의 달인
```

내부 Combat Family는 유지한다.

* 모험가 → Adventurer combat kit
* 검사 / 상급 검사 / 소드마스터 → Warrior combat family
* 마법사 / 상급 마법사 / 대마법사 → Mage combat family
* 도적 / 그림자 도적 / 암살의 달인 → Rogue combat family

직업에 따라:

* 선택지
* NPC 반응
* 전투 방식
* 스킬
* 접근 가능한 해결 방법

이 달라진다. 전직 선택은 MVP에서 되돌리지 않는다.

---

# 5. Dialogue

기본 대화 구조:

```text
NPC Dialogue

1. 선택

2. 선택

3. 선택

4. 직접 말하거나 행동한다
```

4번은 대사만 입력하는 기능이 아니다.

예:

```text
"기사에게 누가 명령했는지 묻는다."

"창문으로 몰래 들어간다."

"세리아에게 윙크하며 문을 가리킨다."

"검을 뽑아 경비병을 위협한다."
```

모두 가능하도록 설계한다.

---

# 6. NPC Knowledge

NPC는 모든 것을 알지 않는다.

예:

북쪽 숲에서 Player와 Seria가 전투를 했다면:

```text
Player    알고 있음
Seria     알고 있음

Leon      모름
Merchant  모름
Innkeeper 모름
```

Leon이 해당 사실을 알기 위해서는:

* Seria에게 듣거나
* Player에게 듣거나
* 사건이 공개적으로 알려지거나

해야 한다.

---

# 7. NPC Relationships

NPC마다 Player를 다르게 평가한다.

```text
Affection
Trust
Fear
Respect
```

범위:

```text
-100 ~ +100
```

단일 호감도만 사용하지 않는다.

예:

```text
Affection  +60
Trust      -20

→ 좋아하지만 믿지는 않음
```

또는:

```text
Affection  -50
Respect    +80
Fear       +60

→ 싫어하지만 함부로 대하지 못함
```

---

# 8. Combat

전투 스타일:

**2D Top-down Action RPG**

초기 조작:

```text
WASD
Move

Space
Dash

Mouse / Left Click
Basic Attack

Q
Skill 1

E
Skill 2
```

초기 개발은 Placeholder 캐릭터로 진행한다.

그래픽은 전투 시스템이 완성된 뒤 교체한다.

---

# 9. Class Combat Identity

## Warrior

* 근접
* 묵직한 공격
* Dash
* 돌진
* Parry

## Mage

* 원거리
* Projectile
* Blink
* Fire / Ice Skill

## Rogue

* 빠른 이동
* 빠른 연속 공격
* 긴 Dash 또는 Shadow Step
* Back Attack

초기 MVP에서는 한 직업으로 전투 시스템을 먼저 완성한 후 확장한다.

---

# 10. Initial World Scope

MVP는 작은 범위로 제한한다.

```text
마을 1개
주요 NPC 약 5명
던전 1개
메인 사건 1개
보스 1개
```

처음부터 오픈월드를 만들지 않는다.

---

# 11. Initial Story Prototype

현재 Vertical Slice는 다음 흐름까지 플레이 가능하다.

```text
NEW GAME
 → 이름 입력 (직업 선택 없음)
 → Lv.1 모험가 · DAY 1 · 08:00
 → 루엔 도착
 → 모험가 길드 등록
 → 마을 탐색 / Marta / Leon / Seria
 → 폐허 Quest
 → 숲길
 → 고대 폐허
 → 일반 전투
 → 부서진 제단 조사 (모험가식 해결)
 → 왕실 마법석 발견
 → 고대 수호자
 → Boss Victory
 → 세리아 보고
 → Chapter 1 Complete
 → Lv4~5 근처에서 첫 전직 (검사 / 마법사 / 도적)
```

범위:

* 메인 지역: 루엔 마을, 푸른 달 여관, 숲길, 고대 폐허, 북문
* 메인 Quest 1개
* Boss 1개 (RUINS_GUARDIAN)
* Groq AI 또는 Mock fallback
* Audio/BGM 구조 (실제 음원 파일은 선택)

이 Vertical Slice가 안정화된 이후 콘텐츠를 확장한다.

---

# 13. Playable Game Flow

```text
APP START
 → TITLE
 → NEW GAME 또는 CONTINUE
 → CHARACTER CREATION
 → GAME INTRO
 → MAIN GAME
```

AppPhase(`TITLE` / `CHARACTER_CREATION` / `GAME`)와 GameMode(`STORY` / `DIALOGUE` / `COMBAT`)는 분리한다.

## Game Clock

`world.totalMinutes`가 Game Clock의 Single Source다. day / hour / minute / timeOfDay는 derive한다.
시작: DAY 1 · 08:00. 자정을 넘기면 Day가 자동 증가한다.
푸른 달 여관 Rest는 다음 날 08:00으로 이동하고 HP/MP를 회복한다.

의미 있는 선택/행동은 Action Resolution 이후 `TIME_ADVANCED` Event로만 시간을 흐르게 한다. React 버튼이 시간을 직접 올리지 않는다.

## Core Gameplay Loop

```text
PLAYER CHOICE
 → Action Validation
 → Action Resolution
 → Domain Events
 → Game Time Advance
 → Action EXP Reward
 → Level Up Check
 → Quest / Knowledge / Relationship / Memory
 → Story Resolver
 → Dynamic Choice
```

성공한 행동은 시간과 최소 EXP를 준다. 같은 대상/장면의 반복 행동은 EXP가 크게 줄어든다.

## Chapter

제1장 — 폐허에서 깨어난 것 (`CHAPTER_1_LUEN_RUINS`)이 현재 Vertical Slice다.
Guardian 격파 + 메인 퀘스트 완료 시 Chapter Complete, 북문 개방, 제2장 훅만 연다.

제2장 이후 전체 콘텐츠는 STEP 32+.

## Level / Class Rank

Level Cap 30. 초반 곡선은 Lv1→2 50, 2→3 80, 3→4 120, 4→5 160.
EXP는 성공한 Action, Quest, Fact, Combat, Boss, Chapter에서 지급한다. Chapter Complete 순간 Level을 강제하지 않는다.

내부 Family ID(`adventurer`/`warrior`/`mage`/`rogue`)는 유지하고, 표시 Job/Rank만 분리한다.

* 모험가 → 검사/마법사/도적(Lv5 + 제1장) → 상급(Lv10) → 마스터(Lv20)

Level만으로 자동 전직하지 않는다. Chapter 1 정상 플레이는 대략 Lv4~5.

## Core Menu

캐릭터 / 인물 / 가방 / 지도 / 퀘스트 / 기록은 실제 최소 기능 또는 Empty State를 가진다.
Navigation Panel은 UI state이며 Story/GameState를 바꾸지 않는다.
캐릭터 화면은 Name, Level, Job, EXP, Stats, Skills, 다음 전직만 표시한다.

---

# 14. Long-term Story Roadmap

* CHAPTER 1 — Lv1~5: 폐허에서 깨어난 것 (루엔, 고대 폐허, Royal Magic Stone, Guardian)
* CHAPTER 2 — Lv5~10: 북문의 그림자 (북부 지역, 1차 전직 준비)
* CHAPTER 3 — Lv10~15: 왕도의 균열
* CHAPTER 4 — Lv15~20: 봉인의 진실 (2차 전직 준비)
* CHAPTER 5+: Master Rank Story

---

# 15. AI Philosophy

AI가 게임을 만드는 것이 아니다.

```text
Game Engine
= 세계의 법칙

AI
= 그 세계 안에서 말하고 행동하는 감독/배우
```

AI가 할 수 있는 것:

* 자연스러운 대화
* 선택지 제안
* 자유입력 해석
* 장면 표현

AI가 직접 하면 안 되는 것:

* 임의로 아이템 지급
* 임의로 Player 스탯 변경
* 세계관 규칙 변경
* NPC가 모르는 정보 사용
* 전투 승패 결정
* Quest 상태 직접 변경
* 상점 가격 변경
* Registry에 없는 Item 생성

---

# 16. Chapter 1 Complete Flow

```text
PROLOGUE / 루엔 도착
→ 모험가 길드 등록 (Lv1 Adventurer)
→ 마르타 / 여관 / 잡화점(엘린) 소개
→ 작은 의뢰와 숲길 Goblin Encounter
→ Gold / Item
→ 세리아 폐허 의뢰
→ Forest Road → Ancient Ruins
→ Mixed Encounter → Royal Magic Stone
→ Guardian Boss Victory
--- POST-BOSS EPILOGUE ---
→ Post-Guardian Investigation (Core/Stone/Mark 조사)
→ Ruins Escape + Forest Return Event (세계 이변 암시)
→ Luen Return Reaction (NPC 반응)
→ Seria Final Report (Knowledge Sharing, Quest 완료)
→ Leon Confrontation (왕실 문양 대면)
→ Inn Rest (에필로그 휴식)
→ Guild Recognition + Lv5 First Advancement (검사 / 마법사 / 도적)
→ Northern Gate Emergency (Chapter 2 Hook)
→ Chapter 1 Complete
```

Chapter 1 완료 조건 (모두 충족):
- RUINS_GUARDIAN_DEFEATED
- SERIA_FINAL_REPORT
- GUILD_RECOGNITION_DONE
- NORTHERN_GATE_HOOK_SEEN
- Quest RUINS_MYSTERY = COMPLETED

Shop은 optional support다. 필수 Quest Item을 상점에서 사도록 강요하지 않는다. Guardian Boss는 Adventurer Kit으로 클리어 가능하다.

---

# 17. Economy

Player Persistent State에 `gold`가 있다. New Game 시작 Gold는 50.

Gold 변경 Event:

* PLAYER_GOLD_GAINED
* PLAYER_GOLD_SPENT

UI는 gold를 직접 수정하지 않는다. `sourceEventId` / `processedRewardIds`로 Quest / Combat / Boss 보상을 한 번만 지급한다.

획득처: Quest Completion, Encounter Victory, Boss Victory, Story Reward, Item Sell.
NPC 대화만으로는 Gold를 주지 않는다. 구매/판매/메뉴 열기는 EXP를 주지 않는다.

Inn Rest: 10G. 다음 날 08:00, HP/MP Full.

---

# 18. Inventory / Equipment / Shop

ItemDefinition은 코드 레지스트리다. Save에는 itemId / quantity / equipped ids만 저장한다.

Item Type: CONSUMABLE, WEAPON, ARMOR, ACCESSORY, KEY_ITEM, MISC.

Equipment Slot: WEAPON / ARMOR / ACCESSORY.

장착 시 Inventory에서 1 감소, 해제 시 1 복귀. 교체 시 기존 장비는 Inventory로 돌아간다.

Derived Stats = Base + Level Growth + Job/Rank + Equipment Bonus (HP / MP / Attack).
CombatConfig는 Derived Stats를 사용한다. 장비에 따라 Sprite 외형은 바꾸지 않는다.

Chapter 1 Shop: `luen_general_store` / NPC `shopkeeper_elin` (엘린).
가격은 ShopDefinition이 권한이다. Groq는 가격을 바꾸지 못한다.

전직 시 Starter Weapon 지급 후 자동 장착. 기존 Weapon은 Inventory 복귀.

