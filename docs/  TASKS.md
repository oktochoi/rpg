# AI RPG — Development Tasks

## Project Status

### STEP 01 — Project Setup

* [x] Next.js / React / TypeScript 프로젝트 구성
* [x] Phaser 구성
* [x] 기본 실행 확인

### STEP 02 — Architecture

* [x] 기본 프로젝트 구조 구성
* [x] Game Core 영역 분리
* [x] Combat 영역 분리
* [x] AI 영역 분리

### STEP 03 — Game State

* [x] GameState 기본 구조
* [x] Command 구조
* [x] Event 구조
* [x] Reducer / State Update 구조

### STEP 04 — Core Game Flow

* [x] 기본 게임 상태 연결
* [x] UI와 GameState 연결
* [x] 직접 Mutation 방지 구조

### STEP 05 — RPG UI

* [x] Header
* [x] Player Panel
* [x] Story Panel
* [x] NPC 영역
* [x] Choice 1 / 2 / 3
* [x] 자유 입력 4
* [x] Quest / Relationship 영역
* [x] Bottom Navigation
* [x] 전투 테스트 진입 버튼

---

# COMPLETED RECENT

## STEP 31.5 — Core Progression Loop / Story Alignment / Adventurer Start / Game Clock / Action EXP / Character UI

Status: COMPLETE

Player는 Lv.1 모험가로 시작한다. 선택마다 Game Time과 EXP가 흐르고, Story는 GameState 조건으로 이어진다. Chapter 1 종료 후 Lv5 근처에서 검사/마법사/도적을 고른다.

* [x] Story Resolver Alignment
* [x] Story Priority Fix
* [x] Chapter 1 Content Expansion
* [x] Adventurer Start
* [x] Remove Class Selection From Character Creation
* [x] Adventurer Combat Kit
* [x] Lv5 First Advancement
* [x] Lv10 Advanced Rank
* [x] Lv20 Master Rank
* [x] Job / Combat Family Separation
* [x] Game Clock
* [x] Day / Hour / Minute
* [x] Action Time Cost
* [x] Travel Time
* [x] Combat Time
* [x] Rest To Next Morning
* [x] Automatic Day Advance
* [x] Action EXP
* [x] EXP Every Successful Choice
* [x] Repeated Action EXP Reduction
* [x] Story Bonus EXP
* [x] Quest Bonus EXP
* [x] Discovery Bonus EXP
* [x] Combat EXP
* [x] Boss EXP
* [x] Chapter EXP
* [x] Resolution ID Duplicate Protection
* [x] Unified Player Turn Pipeline
* [x] Dynamic Choice Time/EXP
* [x] Free Action Time/EXP
* [x] EXP Feedback
* [x] Time Feedback
* [x] Level Up Feedback
* [x] Character Screen
* [x] EXP Bar
* [x] Current Job
* [x] Next Advancement
* [x] Stats
* [x] Skills
* [x] First Advancement UI
* [x] Guild Foundation
* [x] Guild NPC
* [x] Expanded Chapter 1 Beats
* [x] Game History With Time
* [x] Save / Load Clock
* [x] Save / Load Progression
* [x] Old Save Migration
* [x] Groq Time Context
* [x] Groq Job Context
* [x] Full Regression

---

# CURRENT

플레이 가능: **Chapter 1 Organic RPG Loop (STEP 34 COMPLETE)**.

New Game → 길드 등록 → 고블린 의뢰/전투 → Gold → 상점/장비/강화 → 세리아 폐허 → Guardian → 조사/귀환/보고/휴식 → 길드 공적 → **First Advancement** → 북문 Hook → Chapter Complete.

다음 작업은 STEP 35 Chapter 2. Chapter 2는 아직 만들지 않는다.

상세 흐름: `docs/  GAME_DESIGN.md` 맨 위 **현재 상태 / 현재 Chapter 1 플레이 흐름**.

## STEP 32 — Chapter 1 Complete RPG Loop / Economy / Shop / Inventory / Equipment / Story Finalization

Status: COMPLETE

Chapter 1을 실제 UI만으로 처음부터 끝까지 플레이할 수 있는 첫 RPG 챕터로 완성한다. Gold / Inventory / Equipment / Shop / Inn Cost / Combat·Quest Reward와 Story Background / NPC Portrait를 연결한다.

* [x] Chapter 1 Story Finalization
* [x] Background Integration
* [x] NPC Portrait Integration
* [x] Gold
* [x] Gold Reward
* [x] Inventory
* [x] Item Definition
* [x] Consumable
* [x] Equipment
* [x] Equipment Slots
* [x] Equip / Unequip
* [x] Equipment Derived Stats
* [x] Shop
* [x] Buy
* [x] Sell
* [x] Shop UI
* [x] Inn Cost
* [x] Combat Gold Reward
* [x] Combat Item Reward
* [x] Quest Reward
* [x] Reward Duplicate Protection
* [x] Character Equipment UI
* [x] Inventory UI
* [x] First Advancement Starter Equipment
* [x] Save / Load Economy
* [x] Old Save Migration
* [x] Economy Softlock Test
* [x] Chapter 1 Full Playthrough

---

# NEXT

다음 스텝은 **STEP 35 — Chapter 2 Northern Region**. STEP 33 / 34는 완료.

## STEP 33 — Chapter 1 Post-Boss Epilogue & Narrative Completion

Status: COMPLETE

보스 전투 이후 에필로그 씬 체인을 구현하여 Chapter 1을 완전한 스토리 아크로 마감한다.

* [x] Post-Boss Investigation Scene (POST_GUARDIAN_AFTERMATH)
* [x] Ruins Escape + Forest Return Event
* [x] Luen Return Reaction + NPC Dialogue
* [x] Seria Final Report (Knowledge Sharing)
* [x] Leon Confrontation
* [x] Epilogue Inn Rest
* [x] Guild Recognition + First Class Advancement
* [x] Northern Gate Emergency (Chapter 2 Hook)
* [x] Chapter 1 Complete Conditions Updated (4 flags required)
* [x] Main Objective Text for full post-boss flow
* [x] EXP Balance (Lv5 natural reach before advancement)
* [x] canChooseFirstAdvancement: GUILD_RECOGNITION_DONE condition
* [x] SCENE_NOT_VISITED for one-shot narrative scenes
* [x] shouldResolveStory: allow resolution after STORY_UPDATED
* [x] Full Scenario Test (A~V) PASS + tsc + build

## STEP 34 — Chapter 1 Complete Organic RPG Loop

Status: COMPLETE

Chapter 1을 “몇 번 클릭 후 Boss”가 아니라 탐색 / 대화 / 의뢰 / 전투 / Gold / 상점 / 장비 / 강화 / 보고 / 전직이 이어지는 첫 RPG 챕터로 완성한다. Chapter 2는 만들지 않는다.

* [x] Chapter 1 Flow Rewrite
* [x] Goblin Scout Encounter
* [x] Forest Ambush
* [x] Goblin Camp
* [x] Ruins Entrance Encounter
* [x] Side Quest Integration
* [x] Quest Economy Loop
* [x] Gold Balance
* [x] Shop Story Unlock
* [x] Equipment Purchase
* [x] Equipment Stat Integration
* [x] Enhancement +0~+3
* [x] Enhancement Cost
* [x] Enhancement UI
* [x] Enhancement Save
* [x] Dialogue Topic State
* [x] Dialogue Repeat Prevention
* [x] Semantic Candidate Dedup
* [x] Dialogue Exhaustion
* [x] Candidate Fallback
* [x] Zero Choice Prevention
* [x] Main Progress Candidate
* [x] NPC Context Dialogue
* [x] Story Priority Fix
* [x] First Advancement Bug Fix
* [x] First Advancement Resolver
* [x] Advancement Priority
* [x] Advancement Starter Equipment
* [x] Post Boss Flow
* [x] UI Layout Fix
* [x] Footer Single Row
* [x] Footer Duplicate Check
* [x] Modal Overflow Fix
* [x] Long Text Fix
* [x] Combat → Story UI Regression
* [x] Save/Load
* [x] Old Save Migration
* [x] Full Chapter 1 Playthrough

## STEP 35 — Chapter 2 Northern Region

STEP 35에서 실제로:

- Northern Gate 너머 Region
- Chapter 2 Main Story
- Lv5~10 성장
- 신규 NPC
- 신규 Enemy
- Chapter 2 Boss
- Lv10 상급직 전직 준비

를 진행한다.

---

## STEP 31 — Playable Game Flow / Progression / Core Menu Completion

Status: COMPLETE

* [x] Title Screen
* [x] New Game
* [x] Continue
* [x] Settings Entry
* [x] Character Creation
* [x] Player Name
* [x] Class Selection
* [x] Character Preview
* [x] Intro Story
* [x] AppPhase
* [x] New Game State
* [x] Day State
* [x] Rest / Sleep
* [x] Day Advance Event
* [x] Day UI
* [x] Chapter State
* [x] Chapter 1 Integration
* [x] Main Objective UI
* [x] Story Auto Progression
* [x] Chapter Complete
* [x] Chapter 2 Hook
* [x] Northern Gate Unlock
* [x] Player Level
* [x] EXP
* [x] Level Growth
* [x] Level Up UI
* [x] Class Rank
* [x] Advancement Foundation
* [x] Lv10 First Advancement Definition
* [x] Lv20 Master Rank Definition
* [x] Next Advancement UI
* [x] Quest Menu Functional
* [x] Inventory Menu Functional
* [x] Map Menu Functional
* [x] People Menu Functional
* [x] History Menu Functional
* [x] Empty States
* [x] Remove Coming Soon UI
* [x] Production Debug Hidden
* [x] Save/Load Progression
* [x] Old Save Migration
* [x] Groq Progression Context
* [x] Full Playable Flow Test
* [x] Full Regression

---

## STEP 30 — Sound / BGM / Game Feel Polish / Vertical Slice Finalization

Status: COMPLETE

* [x] Audio Manager
* [x] Audio Registry
* [x] Master Volume
* [x] BGM Volume
* [x] SFX Volume
* [x] Mute
* [x] Browser Autoplay Handling
* [x] Story BGM Context
* [x] Combat BGM
* [x] Boss BGM
* [x] BGM Transition
* [x] Combat SFX Integration
* [x] Skill SFX Integration
* [x] UI SFX Integration
* [x] Missing Audio Fallback
* [x] Audio Settings Persistence
* [x] Story Transition Polish
* [x] Location Transition Polish
* [x] Combat Start Transition
* [x] Combat End Transition
* [x] Victory Presentation
* [x] Defeat Presentation
* [x] Groq Loading UX
* [x] Groq Error/Fallback UX
* [x] Quest Update Feedback
* [x] Discovery Feedback
* [x] Combat Feel Final Pass
* [x] Boss Final Pass
* [x] Vertical Slice Full Playthrough
* [x] Save/Load Full Test
* [x] Missing Asset Test
* [x] Missing Groq Test
* [x] Vercel Environment Documentation
* [x] Client/Server Boundary Check
* [x] Production Build
* [x] Full Regression

---

## STEP 29 — Final Character / Monster Sprites & Animation Integration

Status: COMPLETE

* [x] Sprite Asset Definition
* [x] Single Image Support
* [x] Sprite Sheet Support
* [x] Animation Registry
* [x] Player Animation Controller
* [x] Warrior Animation States
* [x] Mage Animation States
* [x] Rogue Animation States
* [x] Goblin Animation States
* [x] Archer Animation States
* [x] Brute Animation States
* [x] Ruins Guardian Animation States
* [x] Facing / Flip
* [x] Attack Animation Visual
* [x] Dash Animation Visual
* [x] Skill Visual Integration
* [x] Hit Animation
* [x] Death Animation
* [x] Phase 2 Boss Visual
* [x] Projectile Asset Integration
* [x] Effect Asset Registry
* [x] Collision / Sprite Separation
* [x] Missing Asset Fallback
* [x] Animation Cleanup
* [x] Asset Manifest
* [x] Full Regression

---

## STEP 28 — Game Visual System / Monster & Character Asset Integration / Combat HUD

Status: COMPLETE — CURRENT STEP 28에서 구현

* [x] Asset Registry
* [x] Asset Loader
* [x] Placeholder Fallback
* [x] Player Visual Layer
* [x] Warrior Visual
* [x] Mage Visual
* [x] Rogue Visual
* [x] Enemy Visual Layer
* [x] Goblin Visual
* [x] Archer Visual
* [x] Brute Visual
* [x] Boss Visual
* [x] Boss Phase Visual
* [x] Projectile Visual
* [x] Skill Effect Visual Foundation
* [x] Player HP HUD
* [x] Player MP HUD
* [x] Dash HUD
* [x] Q/E Skill HUD
* [x] Cooldown Overlay
* [x] Boss HUD
* [x] Enemy HP Visual
* [x] Damage Number Visual
* [x] NPC Portrait Slot
* [x] Story Background Slot
* [x] RPG Theme Foundation
* [x] Missing Asset Fallback
* [x] Visual Cleanup Regression

---

## STEP 27 — Real AI Integration

Status: COMPLETE — CURRENT STEP 27에서 구현

* [x] AI Provider abstraction
* [x] Server-side AI Route
* [x] API Key protection
* [x] Real Action Parser
* [x] Real NPC Dialogue
* [x] Real Story Director
* [x] Structured Output
* [x] Zod Validation
* [x] Knowledge isolation
* [x] Memory Context
* [x] Relationship Context
* [x] Candidate-only Director
* [x] turnId validation
* [x] requestId
* [x] Timeout
* [x] Retry
* [x] Mock fallback
* [x] Prompt injection defense
* [x] AI Debug
* [x] Missing API Key fallback
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 25 — Boss / Major Encounter

Status: COMPLETE

* [x] Boss Definition
* [x] Boss Runtime State
* [x] Boss Registry
* [x] Boss Controller
* [x] Boss Pattern Controller
* [x] Heavy Slam
* [x] Projectile Burst
* [x] Charge
* [x] Telegraph
* [x] Phase 1
* [x] Phase 2
* [x] Phase Transition
* [x] Boss Status Resistance
* [x] Boss HP HUD
* [x] Boss Encounter
* [x] Boss Projectile Cleanup
* [x] Boss Timer Cleanup
* [x] Boss Victory
* [x] Boss Defeat
* [x] Boss Restart
* [x] Story Branch 연결
* [x] Quest 연결
* [x] WorldFact 연결
* [x] PlayerKnowledge 연결
* [x] NPCKnowledge Witness 연결
* [x] Save / Load Regression
* [x] TypeScript 통과
* [x] Build 통과

---

* [x] StorySceneDefinition
* [x] Story Runtime
* [x] Scene Registry
* [x] Scene Conditions
* [x] Scene Resolver
* [x] Scene Priority
* [x] Choice Conditions
* [x] Class Branch
* [x] Quest Branch
* [x] Relationship Branch
* [x] NPC Knowledge Branch
* [x] Memory Branch
* [x] Combat Result Branch
* [x] Free Action Branch
* [x] Scene Save / Load
* [x] Vertical Branching Story
* [x] TypeScript 통과
* [x] Build 통과

---

* [x] Region Definition
* [x] Location Definition
* [x] Location Runtime
* [x] Location Registry
* [x] Player Current Location
* [x] MOVE_TO_LOCATION
* [x] Location Validation
* [x] Location Discovery
* [x] Visit Tracking
* [x] NPC Location
* [x] NPC Location Selector
* [x] Location-based Witness
* [x] Exploration Point
* [x] Quest Location 연결
* [x] Save / Load
* [x] TypeScript 통과
* [x] Build 통과

---

* [x] Quest Definition
* [x] Quest Runtime
* [x] Quest Status
* [x] Objective Type
* [x] Objective Progress
* [x] Quest Registry
* [x] Event 기반 Quest Progress
* [x] Quest UI
* [x] Quest Save / Load
* [x] Quest → WorldFact
* [x] Quest → Relationship
* [x] Quest → Memory
* [x] Vertical Quest 1개 완성
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 21 — Combat Encounter & Enemy Variety

Status: COMPLETE

* [x] Enemy Type
* [x] Enemy Definition
* [x] Goblin
* [x] Archer
* [x] Brute
* [x] Ranged Projectile
* [x] Enemy Behavior 분리
* [x] EnemyManager
* [x] EncounterDefinition
* [x] EncounterManager
* [x] Multiple Enemy
* [x] Encounter Victory
* [x] Restart
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 20 — Class Combat Identity

Status: COMPLETE

* [x] Warrior Basic Attack
* [x] Warrior Dash
* [x] Warrior Q
* [x] Warrior E
* [x] Mage Basic Attack
* [x] Mage Blink
* [x] Mage Q
* [x] Mage E
* [x] Rogue Basic Attack
* [x] Rogue Dash
* [x] Rogue Q
* [x] Rogue E
* [x] Class HUD
* [x] CombatConfig Class 연결
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 19 — Character / Skill Foundation

Status: COMPLETE

* [x] PlayerClass
* [x] Class Definition
* [x] Skill Definition
* [x] Q/E Slot
* [x] Skill Runtime
* [x] MP
* [x] Cooldown
* [x] Character Select → Combat 연결
* [x] Mage Fireball 테스트 구현
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 18 — Save / Load

Status: COMPLETE

* [x] Local Save
* [x] Manual Save
* [x] Load
* [x] 3 Save Slots
* [x] Auto Save
* [x] Save Version
* [x] Save Validation
* [x] Save Migration 기반
* [x] Delete Save
* [x] GameState 복구
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 17 — NPC Memory

Status: COMPLETE

* [x] 중요한 Player 사건 저장
* [x] Importance
* [x] 관련 Memory 조회
* [x] 오래된 저중요 Memory 정리
* [x] NPC Dialogue Context에 Memory 제공
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 16 — NPC Relationship

Status: COMPLETE

* [x] Affection
* [x] Trust
* [x] Fear
* [x] Respect
* [x] Event 기반 관계 변경
* [x] NPC Dialogue 반영
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 15 — Free Action Parser + Action Validation

Status: COMPLETE

* [x] Mock Action Parser
* [x] ParsedAction / ActionType
* [x] Action Validator
* [x] FREE_ACTION Command
* [x] RESOLVING Mode
* [x] ASK → NPC Dialogue
* [x] ATTACK → Combat
* [x] INVALID / UNKNOWN 처리
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 14 — Mock NPC Personality + Knowledge 기반 Dialogue

Status: COMPLETE

* [x] AI Service Interface
* [x] Mock Provider
* [x] NPC Profile
* [x] Personality
* [x] Goal
* [x] Knowledge 기반 Dialogue Context
* [x] Relationship 읽기 반영
* [x] Mock Dialogue
* [x] 1/2/3 Choice → playerInput 연결
* [x] 4 자유입력 → Mock Dialogue
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 13 — WorldFact + NPC Knowledge

Status: COMPLETE

* [x] WorldFact
* [x] NPCKnowledge
* [x] Witness 구조
* [x] NPC가 아는 정보만 조회
* [x] Player Knowledge 분리
* [x] 공개 사건 구조
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 12 — Story ↔ Combat Bridge

Status: COMPLETE

* [x] Story에서 Combat 시작
* [x] CombatConfig 전달
* [x] Phaser Combat 실행
* [x] CombatResult 생성
* [x] Combat 종료
* [x] Event 변환
* [x] GameState 반영
* [x] Story 복귀
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 11 — Combat Feel / Feedback

Status: COMPLETE

* [x] Hit Stop
* [x] Hit Flash
* [x] Camera Shake
* [x] Dash After Image
* [x] Attack Slash Effect
* [x] Damage Number
* [x] Enemy Death Feedback
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 10 — Complete Basic Combat Loop

Status: COMPLETE

* [x] Enemy HP / Player HP
* [x] Player → Enemy Damage
* [x] Enemy → Player Damage
* [x] 한 공격당 Damage 1회
* [x] Hit Feedback / Knockback
* [x] Dash Invincibility 적용
* [x] Player Hurt Invincibility
* [x] Enemy Attack Telegraph / Direction Lock
* [x] Enemy Death / Player Death
* [x] Combat Victory / Defeat
* [x] Combat Restart
* [x] TypeScript 통과
* [x] Build 통과

---

## STEP 07 — Dash / Dodge

Status: COMPLETE

* [x] Space Dash
* [x] Dash 방향 고정
* [x] 마지막 이동 방향 기억
* [x] Dash Cooldown
* [x] Invincibility 상태
* [x] Combat Bounds 유지
* [x] 기본 Dash visual feedback
* [x] TypeScript 검사
* [x] Build 검사

---

## STEP 08 — Basic Attack

Status: COMPLETE

* [x] 마우스 방향 또는 마지막 이동 방향 기준 공격
* [x] Left Click 공격
* [x] Attack State
* [x] Attack Cooldown
* [x] Hitbox
* [x] 공격 중 입력 규칙
* [x] Placeholder 공격 표시

---

## STEP 09 — Enemy

Status: COMPLETE

* [x] Placeholder Enemy
* [x] Enemy State
* [x] Player 추적
* [x] 이동
* [x] Player와 Collision
* [x] Enemy Hitbox / Hurtbox

---

## STEP 26 — Director / Dynamic Choice System

Status: COMPLETE — CURRENT STEP 26에서 구현

* [x] StoryDirectorContext
* [x] DirectorNpcContext
* [x] DirectorQuestContext
* [x] ChoiceCandidate
* [x] DynamicChoice
* [x] Candidate Builder
* [x] Story Candidate
* [x] Quest Candidate
* [x] NPC Candidate
* [x] Knowledge Candidate
* [x] Relationship Candidate
* [x] Memory Candidate
* [x] Exploration Candidate
* [x] Combat Candidate
* [x] Move Candidate
* [x] Class Candidate
* [x] General Candidate
* [x] Critical Choice
* [x] Priority Ranking
* [x] Choice Diversity
* [x] Deterministic Director
* [x] turnId Validation
* [x] Choice Revalidation
* [x] RESOLVING Input Lock
* [x] Fallback Choices
* [x] Dynamic 1/2/3 UI 연결
* [x] Zod Director Response Validation
* [x] Save/Load 이후 Choice 재생성

---

## STEP 25 — Boss / Major Encounter

Status: COMPLETE — CURRENT STEP 25에서 구현

* [x] Boss Definition
* [x] Boss Runtime State
* [x] Boss Registry
* [x] Boss Controller
* [x] Boss Pattern Controller
* [x] Heavy Slam
* [x] Projectile Burst
* [x] Charge
* [x] Telegraph
* [x] Phase 1
* [x] Phase 2
* [x] Phase Transition
* [x] Boss Status Resistance
* [x] Boss HP HUD
* [x] Boss Encounter
* [x] Boss Projectile Cleanup
* [x] Boss Timer Cleanup
* [x] Boss Victory
* [x] Boss Defeat
* [x] Boss Restart
* [x] Story Branch 연결
* [x] Quest 연결
* [x] WorldFact 연결
* [x] PlayerKnowledge 연결
* [x] NPCKnowledge Witness 연결
* [x] Save / Load Regression

---

## STEP 24 — Story Scene / Branching System

Status: COMPLETE — CURRENT STEP 24에서 구현

* [x] StorySceneDefinition
* [x] Story Runtime
* [x] Scene Registry
* [x] Scene Conditions
* [x] Scene Resolver
* [x] Scene Priority
* [x] Choice Conditions
* [x] Class Branch
* [x] Quest Branch
* [x] Relationship Branch
* [x] NPC Knowledge Branch
* [x] Memory Branch
* [x] Combat Result Branch
* [x] Free Action Branch
* [x] Scene Save / Load
* [x] Vertical Branching Story

---

## STEP 23 — World / Location / Exploration

Status: COMPLETE — CURRENT STEP 23에서 구현

* [x] Region Definition
* [x] Location Definition
* [x] Location Runtime
* [x] Location Registry
* [x] Player Current Location
* [x] MOVE_TO_LOCATION
* [x] Location Validation
* [x] Location Discovery
* [x] Visit Tracking
* [x] NPC Location
* [x] NPC Location Selector
* [x] Location-based Witness
* [x] Exploration Point
* [x] Quest Location 연결
* [x] Save / Load

---

## STEP 22 — Quest & Story Progression

Status: COMPLETE — CURRENT STEP 22에서 구현

* [x] Quest Definition
* [x] Quest Runtime
* [x] Quest Status
* [x] Objective Type
* [x] Objective Progress
* [x] Quest Registry
* [x] Event 기반 Quest Progress
* [x] Quest UI
* [x] Quest Save / Load
* [x] Quest → WorldFact
* [x] Quest → Relationship
* [x] Quest → Memory
* [x] Vertical Quest 1개 완성

---

## STEP 21 — Combat Encounter & Enemy Variety

Status: COMPLETE — CURRENT STEP 21에서 구현

* [x] Enemy Type
* [x] Enemy Definition
* [x] Goblin
* [x] Archer
* [x] Brute
* [x] Ranged Projectile
* [x] Enemy Behavior 분리
* [x] EnemyManager
* [x] EncounterDefinition
* [x] EncounterManager
* [x] Multiple Enemy
* [x] Encounter Victory
* [x] Restart

---

## STEP 20 — Class Combat Identity

Status: COMPLETE — CURRENT STEP 20에서 구현

* [x] Warrior Basic Attack
* [x] Warrior Dash
* [x] Warrior Q
* [x] Warrior E
* [x] Mage Basic Attack
* [x] Mage Blink
* [x] Mage Q
* [x] Mage E
* [x] Rogue Basic Attack
* [x] Rogue Dash
* [x] Rogue Q
* [x] Rogue E
* [x] Class HUD
* [x] CombatConfig Class 연결

---

## STEP 19 — Character / Skill Foundation

Status: COMPLETE — CURRENT STEP 19에서 구현

* [x] PlayerClass
* [x] Class Definition
* [x] Skill Definition
* [x] Q/E Slot
* [x] Skill Runtime
* [x] MP
* [x] Cooldown
* [x] Character Select → Combat 연결
* [x] Mage Fireball 테스트 구현

---

## STEP 18 — Save / Load

Status: COMPLETE — CURRENT STEP 18에서 구현

* [x] LocalStorage 또는 IndexedDB
* [x] New Game
* [x] Save
* [x] Load
* [x] Save Version
* [x] GameState 복구

---

## STEP 17 — NPC Memory

Status: COMPLETE — CURRENT STEP 17에서 구현

* [x] 중요한 Player 사건 저장
* [x] Importance
* [x] 관련 Memory 조회
* [x] 오래된 Memory 정리
* [x] NPC Dialogue Context에 Memory 제공

---

## STEP 16 — NPC Relationship 변화

Status: COMPLETE — CURRENT STEP 16에서 구현

* [x] 행동 결과가 NPC 태도에 반영
* [x] Affection / Trust / Fear / Respect Event
* [x] Dialogue에 관계 변화 반영

---

## STEP 17 — Choice System

* [ ] 상황별 선택지 1
* [ ] 상황별 선택지 2
* [ ] 상황별 선택지 3
* [ ] 선택 → Command
* [ ] Rules Validation
* [ ] Event
* [ ] 다음 Scene

---

## STEP 18 — Free Action (moved to STEP 15)

Status: COMPLETE — STEP 15에서 구현

---

## STEP 19 — NPC Relationship (original)

Status: COMPLETE — STEP 16에서 구현

* [x] Affection
* [x] Trust
* [x] Fear
* [x] Respect
* [x] Event 기반 관계 변경
* [x] NPC Dialogue에 관계 반영

---

## STEP 18 — NPC Memory

Status: COMPLETE — STEP 17에서 구현

* [x] 중요한 Player 사건 저장
* [x] Importance
* [x] 관련 Memory 조회
* [x] 오래된 Memory 정리
* [x] NPC Dialogue Context에 Memory 제공

---

## STEP 19 — Save

Status: COMPLETE — STEP 18에서 구현

* [x] LocalStorage 또는 IndexedDB
* [x] New Game
* [x] Save
* [x] Load
* [x] Save Version
* [x] GameState 복구

---

## STEP 20 — Real AI Experiment

게임이 AI 없이 완전히 동작한 뒤 진행한다.

후보:

* [ ] Browser Local AI
* [ ] Transformers.js
* [ ] Ollama 개발 테스트
* [ ] 기타 Provider

AI Provider가 변경되어도 UI / Game Core는 수정하지 않는 구조를 유지한다.

---

# Art / Animation — Later

전투의 기본 조작이 완성된 뒤 진행한다.

* [ ] Player Character Design
* [ ] Idle
* [ ] Walk
* [ ] Dash
* [ ] Attack
* [ ] Hurt
* [ ] Death
* [ ] Enemy Sprite
* [ ] NPC Portrait
* [ ] Background

Placeholder를 먼저 사용한다.

---

# MVP Definition

다음이 모두 가능하면 첫 MVP 완료:

* [ ] 직업 선택
* [ ] Story 화면
* [ ] NPC와 대화
* [ ] 1 / 2 / 3 선택
* [ ] 4 자유 행동
* [ ] Quest 발생
* [ ] 직접 조작 전투
* [ ] Boss 전투
* [ ] Combat Result가 Story에 반영
* [ ] NPC가 Player 행동에 따라 다른 반응
* [ ] Save / Load

---

# Development Rule

한 STEP이 완료되기 전 다음 STEP 기능을 임의로 구현하지 않는다.

각 STEP 완료 조건:

```text
기능 직접 테스트
+
TypeScript 검사
+
Build 통과
+
Git Commit
```

이후 다음 STEP으로 진행한다.
