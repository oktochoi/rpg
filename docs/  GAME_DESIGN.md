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
Story
 ↓
NPC Encounter
 ↓
Dialogue
 ↓
1 / 2 / 3 / Free Action
 ↓
Action Resolution
 ↓
Story / Event / Combat
 ↓
World Change
 ↓
NPC Knowledge / Relationship Change
 ↓
Next Scene
```

---

# 4. Player

초기 직업:

```text
Warrior
Mage
Rogue
```

직업에 따라:

* 선택지
* NPC 반응
* 전투 방식
* 스킬
* 접근 가능한 해결 방법

이 달라진다.

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

예시:

```text
게임 시작

↓

직업 선택

↓

마을 방문

↓

세리아와 만남

↓

1/2/3/4 대화

↓

폐허 관련 Quest

↓

폐허 진입

↓

Combat

↓

Boss

↓

마을 귀환

↓

세리아가 이전 행동과 결과에 따라 반응

↓

결말
```

이 Vertical Slice가 완성된 이후 콘텐츠를 확장한다.

---

# 12. AI Philosophy

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
