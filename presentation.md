---
marp: true
theme: default
paginate: true
---

# Bakhtiyarov Grid
## A Psychonetic Attention Training Application

**Your Name**
**Date: February 2026**

---

# Problem Statement

## Why This Project?

- 🧠 Modern life demands multitasking and distributed attention
- 🎯 Traditional focus training only addresses **concentration**, not **deconcentration**
- 📉 **Gap**: No accessible tools for psychonetic attention training

---

# Theoretical Foundation
## Russian Psychonetics & Deconcentration

- **Oleg Bakhtiyarov** - Soviet scientist, late 1990s
- **Psychonetics**: Training techniques for attention flexibility

### Deconcentration Method
- Unlike concentration (focus on one thing)
- Distribute attention across entire perceptive field
- Process multiple sensory channels simultaneously

**Real-world applications**: Driving, sports, tactical situations, meditation

---

# Project Objectives

## Goals

1. ✅ Create accessible web-based training tool
2. ✅ Implement cross-modal attention integration (visual + auditory)
3. ✅ Progressive difficulty with time pressure
4. ✅ Educational component explaining the science

---

# System Architecture

## Technical Stack

**Backend:**
- Flask (Python web framework)
- Routes: `/` (home), `/game` (gameplay)

**Frontend:**
- HTML5 templates
- CSS with modern aesthetics
- Vanilla JavaScript for game logic

**Key Technologies:**
- Web Speech API for audio cues
- Dynamic DOM manipulation
- Modal-based UI flow

---

# Development Workflow
## Iterative Development Process

**Phase 1: Basic Game Mechanics**
- 3×3 grid with random colors
- Single-modal (visual only) interaction

**Phase 2: Cross-Modal Integration**
- Added auditory prompts (Web Speech API)
- Dual-criterion matching (color + number)

**Phase 3: Difficulty Progression**
- Decreasing time constraint (9s → 2s)

**Phase 4: Educational Layer**
- Bakhtiyarov Grid branding
- Multi-stage onboarding flow

---

# Core Game Mechanics
## How It Works

1. **Visual Prompt**: Text displays target color
2. **Auditory Prompt**: Speech synthesis announces target number
3. **Player Task**: Click box matching BOTH criteria
4. **Time Pressure**: Decreasing response window
5. **Feedback**: Immediate success/failure

### Cognitive Training:
- Forces distributed attention across 3×3 field
- Requires cross-modal sensory integration
- Trains rapid switching between concentration states

---

# User Flow

```
Index Page → Click "Bakhtiyarov Grid"
    ↓
Explanation Modal (About psychonetics)
    ↓
Instructions Modal (How to play)
    ↓
Game Start
    ↓
Rounds (with progressive difficulty)
    ↓
Game Over → Retry Option
```

---

# Key Features

✅ **Cross-Modal Attention Training**
- Visual (color cues) + Auditory (number cues)

✅ **Adaptive Difficulty**
- Time decreases by 0.5s per successful round (9s → 2s minimum)

✅ **Educational Onboarding**
- Two-stage modal system explaining theory + instructions

✅ **Accessibility**
- Contrasting text colors for readability
- Speech synthesis for auditory cues

---

# Technical Challenges & Solutions

### Challenge 1: Color Contrast
- ❌ Problem: Numbers invisible on similar-colored backgrounds
- ✅ Solution: Dynamic contrast calculation (luminance-based)

### Challenge 2: Modal Sequence
- ❌ Problem: Game starting in background, modals showing simultaneously
- ✅ Solution: Proper class management (`hidden` state control)

### Challenge 3: Time Pressure Balance
- ❌ Problem: Too easy or too hard
- ✅ Solution: Gradual decrease (0.5s steps, 2s minimum)

---

# Code Architecture

```
concentration checker app/
├── app.py                 # Flask backend
├── templates/
│   ├── index.html         # Home page
│   └── game.html          # Game interface
└── static/
    ├── style.css          # Styling
    └── script.js          # Game logic (212 lines)
```

**Key JavaScript Functions:**
- `startGame()` - Initialize game state
- `nextRound()` - Generate new grid, prompts, timer
- `handleBoxClick()` - Validate user response
- `startTimer()` - Countdown with visual feedback

---

# Live Demo

## Brief Demonstration

1. Show explanation modal
2. Show instructions modal
3. Play 2-3 rounds
4. Demonstrate time pressure increase
5. Show game over state

*[Switch to live browser demo]*

---

# Results & Impact

## Outcomes

- ✅ **Functional web application** for attention training
- ✅ **Educational value**: Introduces psychonetics concepts
- ✅ **Accessible**: No installation, browser-based
- ✅ **Scalable**: Framework for adding more training modes

### Future Enhancements:
- Deconcentration mode (multiple simultaneous targets)
- Score tracking/leaderboards
- Additional psychonetic exercises

---

# Lessons Learned

## Key Takeaways

- 🎯 **User Experience**: Multiple modals require careful state management
- 📚 **Progressive Disclosure**: Educational content before gameplay improves engagement
- 🎨 **Accessibility**: High-contrast text critical for diverse backgrounds
- 🧪 **Scientific Grounding**: Theory-based design improves user buy-in

---

# Conclusion

## Summary

- Built web-based psychonetic training tool
- Implemented cross-modal attention integration
- Grounded in Bakhtiyarov's deconcentration theory
- Functional, accessible, educational

## Questions?

**Thank you!**
