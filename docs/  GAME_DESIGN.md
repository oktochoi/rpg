# AI RPG — Game Design

## 현재 상태 (STEP 34.10)

플레이 가능한 범위는 **Chapter 1 — 폐허에서 깨어난 것**까지다. Chapter 2는 아직 없다.

New Game부터 Chapter Complete까지 실제 플레이 기준으로 점검한 상태다. 다음 작업은 STEP 35 Chapter 2다.

이 게임의 기본 정체성:

**Main Story는 자연스럽게 이어지는 싱글플레이 Action RPG**

Player가 선택하는 것은 Side Quest, 탐험, 추가 대화, 구매/강화, Stat 투자, 전직, 그리고 정말 중요한 Story Decision이다. Main Story 문장마다 1/2/3을 고르는 Visual Novel 방식은 쓰지 않는다.

루엔은 작은 Hub다. Story / NPC / Shop / Inn / Quest / Exploration이 서로 반응한다.

New Game은 **Lv1 모험가**, Gold 50, 낡은 검 / 여행자 옷으로 루엔에 도착한다. 직업은 캐릭터 생성에서 고르지 않는다. Chapter 1 후반, 길드 공적 인정 뒤 **Lv5 First Advancement**에서 검사 / 마법사 / 도적 중 하나를 고른다.

Guardian을 잡았다고 Chapter가 끝나지 않는다. 조사 → 귀환 → 보고 → 휴식 → 길드 인정 → **전직** → 북문 Hook까지가 한 편이다.

검증 기준: New Game부터 Debug 없이 이어지는 상태 플레이스루.

---

## Main Story Flow Philosophy

- Main Story = 대부분 선형 Sequence. 다음이 명확하면 `[계속]` 또는 Gameplay Trigger로 이어진다.
- Choice = 의미 있는 결정만. Roleplay / Decision. 의미 없는 Progression Choice는 제거한다.
- Side Quest = 주요 optional agency. 수락/거절이 실제 선택이다.
- Hub = 맵/NPC/상점/여관/인벤/캐릭터로 스스로 행동하는 자유 시간.
- Continue는 선택이 아니다. EXP 없음, Time 없음.
- Level Up 시 Stat Point +1. Player가 체력/힘/지능/민첩에 투자한다.
- Rest는 푸른 달 여관. 10G. 에필로그 첫 숙박은 마르타가 무료 제공.
- Relationship 숫자는 Player UI에 노출하지 않는다. 자연어 상태만 표시한다.

권장 Chapter 1 흐름:

```text
New Game → Luen Arrival [계속] → Luen Hub
 → Guild 직접 이동 → Doran Registration Story [계속/Roleplay]
 → Starter Quest → Forest Gameplay → Combat → Return → Reward
 → Luen Free Time (Shop / Side Quest / NPC / Rest)
 → Seria → Preparation Free Time → Ruins → Combat / Investigation → Guardian
 → Post Boss Story → Return → NPC Reports → Rest → Next Morning
 → Guild Recognition → LEVEL 5 → First Advancement Decision
 → New Class → Northern Gate Hook → Chapter Complete
```

---

## 현재 Chapter 1 플레이 흐름

UI 목표 문구(`getMainObjectiveText`)와 실제 다음 행동이 같아야 한다.

```text
TITLE
 → NEW GAME
 → 이름 입력 (직업 선택 없음)
 → Lv1 모험가 · DAY 1 · 08:00
 → 루엔 도착

PHASE 1  루엔의 신참
 → 루엔 도착 [계속]
 → Luen Hub: Location Navigation으로 길드 / 여관 / 잡화점을 직접 이동
 → 마을 탐색: 본 곳만 지도에 표시 (여관·길드·잡화점·북문)
 → 소문: 고블린 증가 / 북쪽 상인 / 세리아와 폐허
 → 마르타 첫 만남 (Roleplay, 언제든 대화 종료)
 → 길드 등록 Story [계속 / 전투 경험 Roleplay] → 칠판 (강제 아님)
   목표: 루엔을 둘러보거나 모험가 길드에서 등록하세요.

PHASE 2  작은 의뢰
 → 길드 칠판: 숲길의 고블린 (Main) / 마르타의 부탁 / 약초 채집 (Optional)
   목표: 길드에서 첫 의뢰를 맡으세요.
 → Forest Road · 발자국/짐/소리 조사 후 Goblin Scouts
   목표: 숲길의 고블린을 처리하세요.
 → 전투 후 추가 조사 가능 → 길드 보고 (말한 정보만 공유) → Gold 30 + EXP 20
   목표: 길드로 돌아가 보상을 받으세요.
 → 이 시점에 상점 / 강화 Unlock

PHASE 3  성장 / 준비 (optional, 강제 구매 없음)
   목표: 장비를 정비하세요. 광장 옆 잡화점을 이용할 수 있습니다.
 → 잡화점 엘린: 물약 / 철제 검 / 가죽 갑옷 / 반지
 → 장비 장착 → 강화 +0~+3 (잡화점 또는 길드)
 → (선택) 숲 매복 Goblin + Archer
 → (선택) 마르타 잃어버린 짐 / 레온 고블린 야영지
 → Leon Camp 조사 시 fact_goblins_moving_near_ruins → 세리아 대화가 달라짐

PHASE 4  세리아와 폐허
   목표: 세리아를 만나세요. → 폐허 조사 의뢰를 맡으세요.
 → Forest Road deeper → Ruins Entrance Mixed (Goblin + Archer + Brute)
   목표: 고대 폐허를 조사하세요. → 폐허 입구의 적을 물리치세요.
 → 제단 / 왕실 문양 / 마법석
   목표: 제단을 조사하세요.
 → Ruins Guardian (Boss)
 → 보스 직후 조사 (핵 / 문양 / 훼손된 봉인). 보스 처치만으로 챕터 종료 아님.

PHASE 5  귀환 / 전직 / 엔딩
 → 폐허 탈출 → 숲 귀환 이벤트 → 루엔
   목표: 폐허를 빠져나가세요. → 루엔으로 돌아가세요.
 → 마르타 반응 → 세리아 보고 → 레온 대면
   목표: 세리아에게 보고하세요. → 레온과 이야기하세요.
 → 여관 휴식 (다음날)
   목표: 푸른 달 여관에서 휴식하세요.
 → 길드 공적 인정
   목표: 길드로 가서 공적을 인정받으세요.
 → Lv5 First Advancement (검사 / 마법사 / 도적)
   목표: 모험가 길드에서 첫 번째 직업을 선택하세요.
 → 북문 긴급 보고 (Chapter 2 Hook)
   목표: 북문으로 향하세요.
 → CHAPTER 1 COMPLETE
```

장소 이동은 인접 로케이션만 가능하다. 길드에서 잡화점으로 한 번에 가지 않고, 마을을 거친다. Choice가 그 hop을 안내한다.

---

## Chapter 1 완료 조건 (모두 필요)

- Quest `ruins_mystery` = COMPLETED
- `RUINS_GUARDIAN_DEFEATED`
- `SERIA_FINAL_REPORT`
- `GUILD_RECOGNITION_DONE`
- `FIRST_ADVANCEMENT_DONE`  ← 전직 없이 Chapter Complete 불가
- `NORTHERN_GATE_HOOK_SEEN`

강제 `player.level = 5`는 없다. EXP로 자연히 Lv5에 도달한 뒤 길드에서 전직한다.

---

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

NPC마다 Player를 다르게 평가한다. 내부 수치는 유지하되, Player-facing UI에는 숫자를 보여주지 않는다.

```text
Affection  개인적 호감. 부탁을 돕거나 배려 있게 행동하면 오른다.
Trust      말과 행동에 대한 신뢰. 약속 이행, 정직한 보고, Quest 완료.
Fear       위협감. 협박/폭력. 일반 정상 플레이에서는 거의 오르지 않는다.
Respect    능력·실력·업적에 대한 인정. 호감과 다르다.
```

Respect가 오르는 경우: Goblin Camp 해결, 위험한 Quest 성공, Guardian 격파, 전투를 NPC가 목격, 신뢰할 만한 공식 보고.

Respect가 오르지 않는 경우: 단순 TALK, 질문, 반복 대사, 상점 이용, Location 이동, Flavor 선택.

People UI 예:

```text
낯선 사람
조금 친숙함
신뢰함
경계함
실력을 인정함
```

범위(내부):

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

모든 Relationship 변경 Event에는 reason / sourceEventId가 있다.

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

## Chapter 1 Combat Design

난이도는 HP/Damage 배수가 아니라 공간과 역할에서 나온다.

### Arena identity

- `forest_scouts_arena`: 나무/바위, 첫 전투 학습. 이동 가능 약 70%.
- `forest_ambush_arena`: 중앙 바위·수레. 근접 압박 + 뒤쪽 Archer.
- `goblin_camp_arena`: 목책/상자로 좌·중·우 통로. 관찰하면 측면 spawn.
- `ruins_entrance`: 기둥/석상. 기둥이 화살을 막는다.
- `ruins_guardian_arena`: 방 형태, 외곽 기둥, 제단. 가장자리 원형 도주가 안전하지 않다.

Story 16:9 일러스트를 Combat map으로 stretch하지 않는다. Phaser primitive로 ground/wall/obstacle을 그린다.

### Enemy roles

- Goblin: chase / flank / lunge. 여러 마리는 겹치지 않고 각도를 나눠 접근.
- Archer: preferred range 유지, 약한 velocity prediction, 무한 후퇴 금지.
- Brute: 느린 이동, telegraph charge, 벽에 부딪히면 recovery.

근접 동시 공격은 Attack Token 2개. Archer는 별도 cadence.

### Difficulty curve

1. Goblin Scouts — Tutorial Easy
2. Forest Ambush — Easy-Medium
3. Goblin Camp — Medium
4. Ruins Entrance — Medium-Hard
5. Guardian — Hard

장비/강화는 체감되게 두고, Enemy는 authored difficulty만 쓴다.

### Guardian patterns

Phase 1: Slam / 3-way burst / 방향 lock Charge.
Phase 2: Slam 후 residue zone, burst variant, Charge recovery 소폭 감소.
같은 패턴 3연속 금지. 거리 weighted selection. 피할 틈이 있는 projectile.

---

# Chapter 1 — Living Luen

루엔은 새 지역을 늘리지 않고, 있는 기능을 원인과 결과로 묶는다.

## Hub interactions

Village / Guild / Inn / Shop / Forest 각각 2~4개의 Interaction Point. 둘러보기는 상태·원샷이며 같은 문장을 반복하지 않는다. Location 설명은 ARRIVAL / AFTER_FIRST_QUEST / AFTER_GOBLIN_CAMP / POST_GUARDIAN variant.

## NPC contextual dialogue

INTRO / CONTEXT / REACTION / SMALL_TALK / EXIT. 중요 Topic은 ONCE. Small Talk는 반복 가능하되 최근 ID는 제외하고 EXP 0. Fingerprint가 바뀌면 contextual line. Public Event만 허용된 NPC가 안다. NPC는 서로에 대해 짧게 말한다.

## Shop progression

Phase A 소모품·중간 무기, Phase B 장비, Phase C 준비 물자. 첫 방문에 살 수 있는 Item이 최소 하나. 비싼 장비는 목표로 남긴다.

## Micro events / optional secrets

Chapter 1 authored 소사건과 비밀 몇 개. Rumor는 Fact가 아니다. Secret는 Knowledge / Dialogue unlock이 보상일 수 있다.

## Quest connections / world reaction

Goblin → Camp → Ruins 맥락. Side Quest는 선택. 완료하면 다른 NPC 대사가 바뀐다. 길드 게시판은 상태에 따라 바뀐다.

## Interaction recovery

선택 불가로 멈추지 않는다. RESOLVING은 finally에서 해제. Groq 실패는 fallback Candidate. Dialogue 소진 시 잡담 또는 종료.

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
 → 루엔 도착 / 마을 탐색
 → 마르타 · 길드 등록 · 첫 작은 의뢰
 → Forest Road Goblin Scouts
 → 보상 / Gold → 상점 Unlock → Potion / Equipment / 강화
 → Optional: Forest Ambush, Goblin Camp (Leon Side Quest)
 → 세리아 폐허 의뢰
 → Ruins Gate Mixed Encounter
 → 제단 조사 / 왕실 마법석
 → Guardian Boss
 → Post-Boss Investigation / 귀환 / Report / Rest
 → Guild Recognition
 → Lv5 First Advancement (검사 / 마법사 / 도적)
 → Northern Gate Hook
 → Chapter 1 Complete
```

범위:

* 메인 지역: 루엔 마을, 푸른 달 여관, 잡화점, 숲길, 고대 폐허, 북문
* Main Quest + Side Quest 2~3개
* 배치된 one-shot Encounter 3~4회 + Boss 1개
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
Guardian 격파만으로 Chapter Complete가 되지 않는다. Investigation, Report, Rest, Guild Recognition, First Advancement, Northern Gate Hook까지 마쳐야 한다.

제2장 콘텐츠는 STEP 35 이후.

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
→ Guild Recognition
→ Lv5 First Advancement (검사 / 마법사 / 도적). 조건 충족 시 길드 Scene 우선
→ Northern Gate Emergency (Chapter 2 Hook)
→ Chapter 1 Complete
```

Chapter 1 완료 조건 (모두 충족):
- RUINS_GUARDIAN_DEFEATED
- SERIA_FINAL_REPORT
- GUILD_RECOGNITION_DONE
- FIRST_ADVANCEMENT_DONE
- NORTHERN_GATE_HOOK_SEEN
- Quest RUINS_MYSTERY = COMPLETED

Shop은 optional support다. 필수 Quest Item을 상점에서 사도록 강요하지 않는다. Guardian Boss는 Adventurer Kit으로 클리어 가능하다.

Chapter 1 Organic Loop:

* Encounter는 배치된 one-shot (`ch1_forest_scouts`, `ch1_forest_ambush`, `ch1_goblin_camp`, `ch1_ruins_gate`). 같은 위치 재입장으로 무한 반복하지 않는다.
* Side Quest는 filler가 아니다. Leon Camp 조사는 `fact_goblins_moving_near_ruins`를 남기고 Seria 대화에 연결된다.
* 첫 Goblin Quest 완료 후 Shop / Enhancement Unlock.
* Dialogue Topic: ONCE / UNTIL_STATE_CHANGE / REPEATABLE / DAILY. 소모된 Topic은 Candidate에서 제외한다. Choice 0개는 Fallback으로 막는다.
* First Advancement Scene Priority 210. 일반 Location Scene보다 앞선다. `player.level = 5` 강제 금지.

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

Enhancement (Chapter 1): Weapon/Armor만 +0~+3. 실패/파괴/확률 없음. 비용 25/50/90G. Weapon 단계당 ATK +2, Armor 단계당 HP +10. Command `ENHANCE_EQUIPMENT`, Event `EQUIPMENT_ENHANCED`.

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

