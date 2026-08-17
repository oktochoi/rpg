# AI RPG — Architecture

## 1. Project Overview

이 프로젝트는 싱글 플레이 AI RPG이다.

핵심 구성:

* Next.js + React: 게임 UI
* Phaser: 실시간 전투
* TypeScript: 전체 코드
* Game Core: 게임 규칙 및 상태 관리
* AI Layer: 추후 NPC 대화 및 자유 입력 처리
* Local Save: 초기 저장
* 추후 Browser Local AI 또는 다른 AI Provider 적용 가능

AI가 게임의 상태를 직접 결정하지 않는다.

게임의 실제 상태와 규칙은 항상 Game Core가 관리한다.

---

# 2. Core Principle

게임의 모든 상태 변화는 다음 흐름을 따른다.

```text
PLAYER
  ↓
UI
  ↓
COMMAND
  ↓
GAME ORCHESTRATOR
  ↓
RULES ENGINE
  ↓
EVENT
  ↓
GAME STATE
```

절대로 다음과 같이 직접 변경하지 않는다.

```ts
player.hp -= 10;
player.gold += 100;
npc.relationship += 20;
```

대신:

```text
Command
↓
Rule Validation
↓
Event
↓
State Update
```

구조를 사용한다.

---

# 3. Main Systems

## Game Core

게임의 중심 시스템.

담당:

* GameState
* Commands
* Events
* Reducer
* Game Orchestrator
* 게임 모드 전환

Game Core가 게임의 Single Source of Truth이다.

---

## React UI

React는 화면 표시와 사용자 입력만 담당한다.

담당:

* Story UI
* NPC Dialogue
* Choices
* 자유 입력
* Player Panel
* Quest UI
* Inventory UI
* 관계 UI
* 메뉴

React에서 GameState를 직접 수정하지 않는다.

React는 Command만 전달한다.

---

## Phaser Combat

Phaser는 실시간 전투만 담당한다.

담당:

* Player Movement
* Dash
* Attack
* Skill
* Enemy
* Projectile
* Collision
* Combat Animation
* Combat Effects

Phaser는 Story / NPC / Quest / World State를 직접 변경하지 않는다.

전투 시작 시 Game Core에서 CombatConfig를 전달받는다.

전투 종료 시 CombatResult를 Game Core에 반환한다.

```text
Game Core
   ↓
CombatConfig
   ↓
Phaser
   ↓
CombatResult
   ↓
Game Core
```

---

# 4. Game Modes

```ts
type GameMode =
  | "STORY"
  | "DIALOGUE"
  | "RESOLVING"
  | "COMBAT"
  | "MENU";
```

## STORY

일반 스토리 진행.

## DIALOGUE

NPC와 대화 중.

## RESOLVING

선택 또는 자유 입력 결과 처리 중.

중복 입력을 막는다.

## COMBAT

Phaser 전투 중.

## MENU

인벤토리 / 퀘스트 / 인물 등 확인.

---

# 5. GameState

GameState는 게임의 실제 상태를 보관한다.

```ts
interface GameState {
  meta: GameMeta;
  mode: GameMode;

  player: PlayerState;

  world: WorldState;

  npcs: Record<string, NPCState>;

  relationships: Record<string, RelationshipState>;

  quests: Record<string, QuestState>;

  inventory: InventoryState;

  knowledge: PlayerKnowledge;

  story: StoryState;

  history: GameEvent[];
}
```

---

# 6. Command / Event

## Command

플레이어나 시스템이 시도하는 행동.

예:

```text
START_GAME
SELECT_JOB
START_DIALOGUE
SELECT_CHOICE
FREE_ACTION
START_COMBAT
USE_ITEM
```

Command는 아직 실제로 일어난 일이 아니다.

---

## Event

게임 규칙을 통과하여 실제로 발생한 사건.

예:

```text
GAME_STARTED
JOB_SELECTED
DIALOGUE_STARTED
CHOICE_SELECTED
COMBAT_STARTED
COMBAT_ENDED
ITEM_RECEIVED
NPC_RELATIONSHIP_CHANGED
```

GameState는 Event를 통해서만 변경한다.

---

# 7. World Knowledge Architecture

세계에서 실제로 발생한 사실과 NPC가 알고 있는 사실을 분리한다.

## WorldFact

세계에서 실제로 발생한 사건.

예:

```text
북쪽 숲에서 도적이 죽었다.
```

## NPC Knowledge

NPC가 알고 있는 정보만 저장한다.

```text
World Fact

Player     KNOWS
Seria      KNOWS

Leon       UNKNOWN
Merchant   UNKNOWN
```

NPC는 자신이 알 수 없는 장소에서 발생한 사건을 자동으로 알 수 없다.

NPC가 정보를 얻는 방법:

* 직접 목격
* Player에게 들음
* 다른 NPC에게 들음
* 공개 사건
* 소문
* Quest / Event

---

# 8. NPC System

NPC는 다음 정보를 가진다.

```text
NPC

Profile
├─ Name
├─ Job
├─ Personality
├─ Speaking Style
└─ Values

Goals
├─ Current Goal
└─ Long-term Goal

Knowledge
└─ NPC가 알고 있는 사실

Relationship
├─ Affection
├─ Trust
├─ Fear
└─ Respect

Memory
└─ Player와 관련된 중요 사건

Current State
├─ Location
├─ Mood
└─ Current Goal
```

NPC가 세계 전체 데이터를 볼 수 없게 한다.

---

# 9. AI Architecture

초기 개발에서는 Mock AI를 사용한다.

추후 실제 AI Provider로 교체 가능하게 만든다.

```text
GAME
 ↓
AI SERVICE
 ↓
Provider
 ├─ Mock AI
 ├─ Browser Local AI
 └─ Other AI
```

AI 역할:

### Director

* 장면 텍스트
* 선택지 1 / 2 / 3

### NPC AI

* NPC 대화
* 감정 표현

### Action Parser

선택지 4의 플레이어 자유 입력을 게임 행동으로 해석.

### Memory

필요한 경우 NPC 기억을 요약.

AI는 GameState를 직접 변경할 수 없다.

---

# 10. Player Choice System

모든 주요 대화/장면은 다음 구조를 사용한다.

```text
1. 추천 선택지

2. 추천 선택지

3. 추천 선택지

4. 자유 입력
```

1~3번은 일반 Command로 처리한다.

4번 자유 입력은 Action Parser를 거친다.

```text
Player Free Text
      ↓
Action Parser
      ↓
Command
      ↓
Rules Engine
      ↓
Event
```

---

# 11. Combat Architecture

전투는 Story System과 분리한다.

```text
Story
 ↓
COMBAT_STARTED
 ↓
CombatConfig
 ↓
Phaser
 ↓
CombatResult
 ↓
Events
 ↓
GameState
 ↓
Story
```

Phaser 내부 CombatState는 전투 중에만 존재한다.

예:

```text
Player Position
Velocity
Enemy Position
Projectile
Cooldown
Animation State
Hitbox
```

이 데이터는 매 프레임 GameState에 저장하지 않는다.

---

# 12. Project Structure

```text
src/

├── app/
│
├── game/
│   ├── core/
│   │   ├── game-state.ts
│   │   ├── commands.ts
│   │   ├── events.ts
│   │   ├── reducer.ts
│   │   └── orchestrator.ts
│   │
│   ├── rules/
│   │
│   ├── player/
│   │
│   ├── world/
│   │
│   ├── npc/
│   │
│   ├── story/
│   │
│   └── combat/
│       ├── CombatGame.ts
│       ├── CombatBridge.ts
│       ├── scenes/
│       ├── player/
│       ├── enemies/
│       └── skills/
│
├── ai/
│   ├── types.ts
│   ├── service.ts
│   ├── mock/
│   └── providers/
│
├── components/
│   ├── story/
│   ├── dialogue/
│   ├── hud/
│   ├── combat/
│   └── menu/
│
├── schemas/
│
└── save/
```

---

# 13. Architecture Rules

1. GameState를 직접 mutate하지 않는다.
2. 상태 변화는 Command → Event 구조를 사용한다.
3. React는 Command만 전달한다.
4. Phaser는 Combat 영역만 담당한다.
5. AI는 GameState를 직접 수정하지 않는다.
6. NPC는 자신이 알고 있는 정보만 사용할 수 있다.
7. AI 출력은 Schema Validation을 거친다.
8. 전투 State와 Main GameState를 분리한다.
9. 새로운 기능은 기존 시스템을 직접 침범하지 않는다.
10. Architecture 변경은 명시적인 결정 없이 진행하지 않는다.
