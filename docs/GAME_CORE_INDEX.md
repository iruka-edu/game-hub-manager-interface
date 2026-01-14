# Game Core Package Index - Iruka Mini Game SDK

## Overview

Mục lục chi tiết cho package `@iruka-edu/game-core` - core package framework-agnostic cung cấp bridge, contract, protocol và utilities để giao tiếp giữa game và hub. Document này giúp AI hiểu cấu trúc và mục đích của từng file/folder để sử dụng đúng component khi cần.

**Version**: 0.2.0  
**Registry**: GitHub Packages (`https://npm.pkg.github.com`)  
**Bundle Format**: ESM + CJS dual format  

---

## 📁 Root Level Files

### `/src/index.ts` - Main Export File
**Mục đích**: Entry point chính, export tất cả public APIs  
**Khi nào dùng**: Import bất kỳ function/type nào từ game-core  
**Exports chính**:
- Contract types (GameManifest, GameType, etc.)
- Protocol types (HubCommand, GameEvent, LaunchContext)
- Bridge functions (createIframeBridge, createHubBridge)
- Validation functions (validateManifest, normalizeResult)

### `/src/contract.ts` - Contract Definitions
**Mục đích**: Định nghĩa contract version, types, enums và interfaces cốt lõi  
**Khi nào dùng**: Cần types cho GameManifest, GameType, Subject, Grade, DifficultyLevel  
**Nội dung chính**:
- `CONTRACT_VERSION = "1.0.0"` - Version hiện tại của contract
- `GameType` - Enum các loại game (quiz, drag_drop, trace, classify, memory, custom)
- `Subject` - Enum môn học (math, vietnamese, english, logic, science, art, music, pe)
- `Grade` - Enum cấp độ (pre-k, k, 1-12)
- `DifficultyLevel` - Enum độ khó (easy, medium, hard)
- `GameManifest` - Interface cho manifest.json
- `RawResult` - Interface cho kết quả thô từ game
- `NormalizedSubmitBody` - Interface cho kết quả đã chuẩn hóa

### `/src/protocol.ts` - Protocol & Messaging
**Mục đích**: Định nghĩa message protocol, envelope structure và message types  
**Khi nào dùng**: Cần hiểu message flow, tạo custom messages, validate messages  
**Nội dung chính**:
- `MsgEnvelope<T>` - Wrapper cho tất cả messages
- `MessageType` - Constants cho message types
- `HubCommand` - Union type cho commands từ Hub → Game
- `GameEvent` - Union type cho events từ Game → Hub
- `LaunchContext` - Context được gửi trong INIT command
- Helper functions: `makeEnvelope`, `isValidEnvelope`, `validateMessageSize`

### `/src/bridge.ts` - Bridge Factory Functions
**Mục đích**: Factory functions để tạo bridges, simplified API  
**Khi nào dùng**: Tạo bridge đơn giản, không cần advanced features  
**Nội dung chính**:
- `createIframeBridge()` - Tạo bridge cho game (trong iframe)
- `createHubBridge()` - Tạo bridge cho hub (parent window)
- `IframeBridge` interface - API cho game-side bridge
- `HubBridge` interface - API cho hub-side bridge

### `/src/manifest.ts` - Manifest Validation
**Mục đích**: Validate game manifest.json theo contract  
**Khi nào dùng**: Validate manifest trước khi deploy, trong development tools  
**Nội dung chính**:
- `validateManifest()` - Main validation function
- `ManifestValidationReport` - Kết quả validation với errors/warnings
- `ManifestValidationIssue` - Chi tiết từng lỗi validation

### `/src/normalization.ts` - Result Normalization
**Mục đích**: Chuẩn hóa kết quả game về format thống nhất  
**Khi nào dùng**: Xử lý kết quả game trước khi gửi lên hub/backend  
**Nội dung chính**:
- `normalizeResult()` - Main normalization function
- `NormalizationReport` - Kết quả normalization với warnings
- Game-type specific conversion logic

### `/src/manifest.schema.json` - JSON Schema
**Mục đích**: JSON Schema cho manifest validation  
**Khi nào dùng**: IDE validation, external tools validation  

### Other Root Files
- `/src/idempotency.ts` - Idempotency utilities (prevent duplicate operations)
- `/src/monitoring.ts` - Monitoring và metrics collection
- `/src/preflight.ts` - Pre-flight checks trước khi start game

---

## 📁 `/src/bridge/` - Bridge Implementations

### `/src/bridge/iframeBridge.ts` - Game-Side Bridge
**Mục đích**: Advanced iframe bridge implementation cho game  
**Khi nào dùng**: Cần advanced features, custom message handling, handshake protocol  
**Nội dung chính**:
- `GameBridge` interface - Advanced game bridge API
- `connectToHub()` - Connect với handshake protocol
- Message queuing, retry logic, connection state management

### `/src/bridge/hubBridge.ts` - Hub-Side Bridge
**Mục đích**: Advanced hub bridge implementation  
**Khi nào dùng**: Hub cần advanced control, multiple games, complex lifecycle  
**Nội dung chính**:
- `HandshakeHubBridge` class - Advanced hub bridge
- Connection management, timeout handling, error recovery

---

## 📁 `/src/protocol/` - Protocol Details

### `/src/protocol/index.ts` - Protocol Exports
**Mục đích**: Re-export protocol types và functions  
**Khi nào dùng**: Import protocol-specific items  

### `/src/protocol/protocol.ts` - Core Protocol Logic
**Mục đích**: Core protocol implementation, message validation  
**Khi nào dùng**: Custom protocol handling, message validation  

---

## 📁 `/src/game/` - Game-Side Utilities

### `/src/game/index.ts` - Game Exports
**Mục đích**: Export game-side utilities  

### `/src/game/baseGame.ts` - Base Game Class
**Mục đích**: Base class cho games, common lifecycle management  
**Khi nào dùng**: Tạo game class với standard lifecycle  

### `/src/game/gameSdk.v1.ts` - Legacy SDK v1
**Mục đích**: Backward compatibility với SDK v1  
**Khi nào dùng**: Migrate từ SDK v1, legacy game support  

### `/src/game/esmBridge.ts` - ESM Bridge
**Mục đích**: Bridge cho ES modules games  
**Khi nào dùng**: Game sử dụng ES modules thay vì iframe  

### `/src/game/statsCore.ts` - Statistics Core
**Mục đích**: Core statistics tracking và calculation  
**Khi nào dùng**: Track game statistics, performance metrics  

### `/src/game/types.ts` - Game Types
**Mục đích**: Game-specific type definitions  
**Khi nào dùng**: Cần game-side types  

---

## 📁 `/src/hub/` - Hub-Side Utilities

### `/src/hub/index.ts` - Hub Exports
**Mục đích**: Export hub-side utilities  

### `/src/hub/sessionController.ts` - Session Management
**Mục đích**: Quản lý game sessions, lifecycle control  
**Khi nào dùng**: Hub cần quản lý multiple sessions, session state  

### `/src/hub/iframeBridge.ts` - Hub Iframe Bridge
**Mục đích**: Hub-side iframe bridge implementation  
**Khi nào dùng**: Hub embed games trong iframe  

### `/src/hub/iframeBridge.v1.ts` - Legacy Hub Bridge v1
**Mục đích**: Backward compatibility với hub bridge v1  
**Khi nào dùng**: Legacy hub integration  

---

## 📁 `/src/phaser/` - Phaser Integration

### `/src/phaser/index.ts` - Phaser Exports
**Mục đích**: Export Phaser utilities  

### `/src/phaser/assetManager.ts` - Asset Management
**Mục đích**: Quản lý assets trong Phaser games  
**Khi nào dùng**: Load/manage assets, preloading, asset optimization  

### `/src/phaser/scaleManager.ts` - Scale Management
**Mục đích**: Responsive scaling cho Phaser games  
**Khi nào dùng**: Handle resize events, responsive design  

### `/src/phaser/HowlerAudioManager.ts` - Audio Management
**Mục đích**: Audio management sử dụng Howler.js  
**Khi nào dùng**: Play music/SFX, audio controls, cross-browser audio  

### `/src/phaser/createEndGameScene.ts` - End Game Scene
**Mục đích**: Tạo end game scene template  
**Khi nào dùng**: Standard end game UI, results display  

### `/src/phaser/audio/` - Audio Utilities
#### `/src/phaser/audio/audioRuntime.ts` - Audio Runtime
**Mục đích**: Runtime audio management  
**Khi nào dùng**: Runtime audio control, dynamic audio loading  

#### `/src/phaser/audio/audioSources.ts` - Audio Sources
**Mục đích**: Audio source management  
**Khi nào dùng**: Manage multiple audio sources, audio streaming  

---

## 📁 `/src/runtime/` - Runtime Utilities

### `/src/runtime/index.ts` - Runtime Exports
**Mục đích**: Export runtime utilities  

### `/src/runtime/gameSessionUiRuntime.ts` - Game Session UI
**Mục đích**: UI runtime cho game sessions  
**Khi nào dùng**: Game session UI, HUD management  

### `/src/runtime/score/` - Score Management
#### `/src/runtime/score/scoreTimer.ts` - Score Timer
**Mục đích**: Timer cho scoring system  
**Khi nào dùng**: Time-based scoring, countdown timers  

### `/src/runtime/state/` - State Management
#### `/src/runtime/state/stateClient.ts` - State Client
**Mục đích**: Client-side state management  
**Khi nào dùng**: Manage game state, state synchronization  

#### `/src/runtime/state/stateStore.ts` - State Store
**Mục đích**: State storage và persistence  
**Khi nào dùng**: Save/load game state, state persistence  

### `/src/runtime/ui/` - UI Components
#### `/src/runtime/ui/hudDom.ts` - HUD DOM
**Mục đích**: DOM-based HUD components  
**Khi nào dùng**: Overlay UI, DOM-based game UI  

#### `/src/runtime/ui/resultOverlayDom.ts` - Result Overlay
**Mục đích**: Result overlay UI  
**Khi nào dùng**: Show game results, completion screens  

---

## 📁 `/src/converters/` - Result Converters

### `/src/converters/quiz.ts` - Quiz Converter
**Mục đích**: Convert quiz results to normalized format  
**Khi nào dùng**: Process quiz game results, calculate accuracy/completion  
**Nội dung chính**:
- `convertQuiz()` - Convert quiz raw results
- Quiz-specific calculations (accuracy, completion rate)

---

## 📁 `/src/utils/` - Utility Functions

### `/src/utils/index.ts` - Utility Exports
**Mục đích**: Export utility functions  
**Khi nào dùng**: Common utilities, helper functions  

---

## 🎯 Usage Patterns

### 1. Basic Game Integration
```typescript
// Import basic bridge
import { createIframeBridge } from '@iruka-edu/game-core';

// Create bridge
const bridge = createIframeBridge(handleCommand);
bridge.ready(['score', 'progress']);
```

### 2. Manifest Validation
```typescript
// Import validation
import { validateManifest } from '@iruka-edu/game-core';

// Validate manifest
const report = validateManifest(manifestJson);
if (!report.ok) {
  console.error('Validation errors:', report.errors);
}
```

### 3. Result Processing
```typescript
// Import normalization
import { normalizeResult } from '@iruka-edu/game-core';

// Normalize results
const { body, warnings } = normalizeResult('quiz', rawResult, context);
```

### 4. Advanced Bridge Usage
```typescript
// Import advanced bridge
import { connectToHub } from '@iruka-edu/game-core';

// Connect with handshake
const bridge = await connectToHub({
  targetOrigin: 'https://hub.iruka.edu',
  timeout: 10000
});
```

### 5. Phaser Integration
```typescript
// Import Phaser utilities
import { HowlerAudioManager, assetManager } from '@iruka-edu/game-core';

// Use in Phaser scene
const audioManager = new HowlerAudioManager();
audioManager.playMusic('bgm');
```

---

## 🔍 When to Use Each Component

### Bridge Components
- **`/src/bridge.ts`** - Simple bridge creation, basic usage
- **`/src/bridge/iframeBridge.ts`** - Advanced game bridge, handshake protocol
- **`/src/bridge/hubBridge.ts`** - Advanced hub bridge, multiple games

### Protocol Components
- **`/src/protocol.ts`** - Message types, validation, envelope creation
- **`/src/protocol/protocol.ts`** - Custom protocol handling

### Validation Components
- **`/src/manifest.ts`** - Manifest validation
- **`/src/normalization.ts`** - Result normalization

### Game Development
- **`/src/game/`** - Game-side utilities, base classes
- **`/src/phaser/`** - Phaser-specific integration
- **`/src/runtime/`** - Runtime UI, state management

### Hub Development
- **`/src/hub/`** - Hub-side utilities, session management

---

## 📋 Development Guidelines

### Adding New Components
1. **Contract changes** → Update `/src/contract.ts`
2. **New message types** → Update `/src/protocol.ts`
3. **Game utilities** → Add to `/src/game/`
4. **Hub utilities** → Add to `/src/hub/`
5. **Framework integration** → Add to appropriate folder (e.g., `/src/phaser/`)

### Export Strategy
- All public APIs must be exported through `/src/index.ts`
- Internal utilities can be exported through folder-specific index files
- Keep exports minimal and focused

### Dependencies
- **NO React/Vue/Angular** - Keep framework-agnostic
- **Phaser as peer dependency** - Optional, only for Phaser utilities
- **Minimal external dependencies** - Keep bundle size small

---

**Remember**: game-core là foundation package. Giữ nó framework-agnostic và focused vào core functionality!