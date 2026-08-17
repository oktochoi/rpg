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

# CURRENT

## STEP 06 — Basic Combat Movement

Status: COMPLETE

* [x] CombatScene
* [x] PlayerController
* [x] Placeholder Player
* [x] WASD 이동
* [x] 8방향 이동
* [x] 대각선 속도 Normalize
* [x] Combat Bounds
* [x] 전투 테스트 화면
* [x] TypeScript 통과
* [x] Build 통과

---

# NEXT

## STEP 07 — Dash / Dodge

* [ ] Space Dash
* [ ] Dash 방향 고정
* [ ] 마지막 이동 방향 기억
* [ ] Dash Cooldown
* [ ] Invincibility 상태
* [ ] Combat Bounds 유지
* [ ] 기본 Dash visual feedback
* [ ] TypeScript 검사
* [ ] Build 검사

---

## STEP 08 — Basic Attack

STEP 07 완료 후 진행.

예정:

* [ ] 마우스 방향 또는 마지막 이동 방향 기준 공격
* [ ] Left Click 공격
* [ ] Attack State
* [ ] Attack Cooldown
* [ ] Hitbox
* [ ] 공격 중 입력 규칙
* [ ] Placeholder 공격 표시

아직 Enemy Damage는 연결하지 않는다.

---

## STEP 09 — Enemy

STEP 08 완료 후 진행.

예정:

* [ ] Placeholder Enemy
* [ ] Enemy State
* [ ] Player 추적
* [ ] 이동
* [ ] Player와 Collision
* [ ] Enemy Hitbox / Hurtbox

---

## STEP 10 — Damage / Combat Loop

* [ ] Player → Enemy Damage
* [ ] Enemy → Player Damage
* [ ] HP
* [ ] Invincibility 적용
* [ ] Knockback
* [ ] Hit Stop
* [ ] Enemy Death
* [ ] Player Death
* [ ] Combat Victory
* [ ] Combat Defeat

---

## STEP 11 — Combat Feel

* [ ] 공격 타격감
* [ ] 작은 Screen Shake
* [ ] Hit Flash
* [ ] Dash After Image
* [ ] Attack Effect
* [ ] Damage Number
* [ ] Sound Placeholder

그래픽 완성보다 조작감을 우선한다.

---

## STEP 12 — Combat ↔ Story Bridge

* [ ] Story에서 Combat 시작
* [ ] CombatConfig 전달
* [ ] Phaser Combat 실행
* [ ] CombatResult 생성
* [ ] Combat 종료
* [ ] Event 변환
* [ ] GameState 반영
* [ ] Story 복귀

---

## STEP 13 — NPC Knowledge

* [ ] WorldFact
* [ ] NPCKnowledge
* [ ] Witness 구조
* [ ] NPC가 아는 정보만 조회
* [ ] Player Knowledge 분리
* [ ] 공개 사건 구조

NPC Memory보다 Knowledge 구조를 먼저 구현한다.

---

## STEP 14 — Mock NPC

* [ ] AI Service Interface
* [ ] Mock Provider
* [ ] NPC Profile
* [ ] Personality
* [ ] Goal
* [ ] Knowledge
* [ ] Relationship
* [ ] Mock Dialogue

실제 AI는 아직 연결하지 않는다.

---

## STEP 15 — Choice System

* [ ] 상황별 선택지 1
* [ ] 상황별 선택지 2
* [ ] 상황별 선택지 3
* [ ] 선택 → Command
* [ ] Rules Validation
* [ ] Event
* [ ] 다음 Scene

---

## STEP 16 — Free Action

* [ ] 선택지 4 자유입력
* [ ] Mock Action Parser
* [ ] 자유 입력 → Intent
* [ ] Intent → Command
* [ ] Rules Validation
* [ ] 성공 / 실패
* [ ] NPC 반응

---

## STEP 17 — NPC Relationship

* [ ] Affection
* [ ] Trust
* [ ] Fear
* [ ] Respect
* [ ] Event 기반 관계 변경
* [ ] NPC Dialogue에 관계 반영

---

## STEP 18 — NPC Memory

* [ ] 중요한 Player 사건 저장
* [ ] Importance
* [ ] 관련 Memory 조회
* [ ] 오래된 Memory 정리
* [ ] NPC Dialogue Context에 Memory 제공

---

## STEP 19 — Save

* [ ] LocalStorage 또는 IndexedDB
* [ ] New Game
* [ ] Save
* [ ] Load
* [ ] Save Version
* [ ] GameState 복구

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
