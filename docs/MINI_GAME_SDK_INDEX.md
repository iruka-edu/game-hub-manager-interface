# Mini Game SDK Package Index - Iruka Mini Game SDK

## Overview

Mục lục chi tiết cho package `@iruka-edu/mini-game-sdk` - full SDK với React adapter, Phaser integration, audio utilities và framework-specific extensions. Package này phụ thuộc vào game-core và mở rộng thêm framework integrations. Document này giúp AI hiểu cấu trúc và mục đích của từng file/folder để sử dụng đúng component khi cần.

**Version**: 0.3.2  
**Registry**: GitHub Packages (`https://npm.pkg.github.com`)  
**Bundle Format**: ESM + CJS dual format  
**Dependencies**: `@iruka-edu/game-core`, `howler`  
**Peer Dependencies**: `react`, `react-dom`, `phaser`  

---

## 📁 Root Level Files

### `/src/index.ts` - Main Export File
**Mục đích**: Entry point chính, re-export tất cả từ game-core + SDK-specific features  
**Khi nào dùng**: Import bất kỳ function/type nào từ mini-game-sdk  
**Exports chính**:
- **Re-exports từ game-core**: Contract types, Protocol types, Bridge functions, Validation functions
- **SDK-specific**: React components, Phaser utilities, Game base classes, State management
- **Namespaced exports**: `game.*`, `runtime.*`, `phaser.*`, `core.*`
- **Debug utilities**: `__testSpy` cho debugging và testing

**Key Features**:
```typescript
// All game-core exports available
import { createIframeBridge, validateManifest } from '@iruka-edu/mini-game-sdk';

// SDK-specific features
import { IrukaGameHost, BaseGame, AutoSaveManager } from '@iruka-edu/mini-game-sdk';

// Namespaced access
import { game, runtime, phaser, core } from '@iruka-edu/mini-game-sdk';
```

---

## 📁 `/src/react/` - React Integration

### `/src/react/index.ts` - React Exports
**Mục đích**: Export React-specific components và utilities  
**Khi nào dùng**: Import React components từ SDK  

### `/src/react/IrukaGameHost.tsx` - React Game Host Component
**Mục đích**: React component để host Iruka games với lifecycle management  
**Khi nào dùng**: Embed games trong React applications, manage game lifecycle  
**Features**:
- **Lifecycle Management**: Tự động handle init, start, pause, resume, dispose
- **Visibility API**: Tự động pause/resume khi user switch tabs
- **Type Safety**: Full TypeScript support với proper typing
- **Flexible**: Accept custom game creation function và config

**Usage Pattern**:
```typescript
import { IrukaGameHost } from '@iruka-edu/mini-game-sdk';

function GameContainer() {
  const createGame = () => new MyPhaserGame();
  const config = {
    runtime: 'iframe-html',
    locale: 'vi',
    difficulty: 2,
    player: { userId: 'user123' },
    hubApi: myHubApi
  };

  return (
    <IrukaGameHost 
      createGame={createGame}
      config={config}
      className="w-full h-full"
    />
  );
}
```

---

## 📁 `/src/state/` - State Management

### `/src/state/AutoSaveManager.ts` - Auto Save Manager
**Mục đích**: Quản lý auto-save game state với debouncing để tránh excessive Hub calls  
**Khi nào dùng**: Games cần auto-save functionality, prevent data loss  
**Features**:
- **Debouncing**: Delay saves để tránh too frequent calls
- **Flush on Demand**: Force save immediately (useful for pause/quit)
- **Error Handling**: Graceful error handling với retry logic
- **Optimistic Updates**: Clear pending state before save để avoid conflicts

**Usage Pattern**:
```typescript
import { AutoSaveManager } from '@iruka-edu/mini-game-sdk';

const autoSave = new AutoSaveManager(
  async (state) => {
    await hubApi.save(state);
  },
  3000 // 3 second debounce
);

// Request save (will be debounced)
autoSave.requestSave({ level: 5, score: 1000 });

// Force save immediately (on pause/quit)
await autoSave.flush();
```

---

## 📁 `/src/core/` - Core Extensions

### Overview
Core folder chứa extensions và utilities được build trên top của game-core, organized theo functional areas. Đây là phần "value-add" của mini-game-sdk so với game-core.

---

## 📁 `/src/core/game/` - Game-Side Extensions

### `/src/core/game/index.ts` - Game Exports
**Mục đích**: Export game-side utilities và classes  

### `/src/core/game/types.ts` - SDK Game Types
**Mục đích**: Type definitions specific cho SDK (khác với game-core contract types)  
**Khi nào dùng**: Cần SDK-specific types cho game development  
**Key Types**:
- `Runtime` - "iframe-html" | "esm-module"
- `Capability` - Game capabilities (score, progress, levels, hints, etc.)
- `GameManifest` - SDK-specific manifest (khác với contract GameManifest)
- `GameRuntimeConfig` - Runtime configuration cho games
- `SaveState` - State structure cho save/load
- `TelemetryEvent` - Telemetry event structure
- `GameBridgeApi` - API interface cho Hub communication
- `IrukaGame` - Interface cho game implementations

### `/src/core/game/baseGame.ts` - Base Game Class
**Mục đích**: Abstract base class cho games với common lifecycle và utilities  
**Khi nào dùng**: Tạo game class với standard lifecycle, telemetry, save/load  
**Features**:
- **Lifecycle Methods**: onInit, onStart, onPause, onResume, onDispose
- **Telemetry Integration**: Automatic telemetry events
- **Save/Load**: Built-in save/load functionality
- **Configuration Access**: Easy access to runtime config

**Usage Pattern**:
```typescript
import { BaseGame } from '@iruka-edu/mini-game-sdk';

class MyGame extends BaseGame {
  async onInit(cfg) {
    await super.onInit(cfg);
    // Custom initialization
  }

  async onStart() {
    await super.onStart();
    // Start game logic
  }

  onPause() {
    super.onPause();
    // Pause game
  }
}
```

### `/src/core/game/gameSdk.v1.ts` - Legacy SDK v1
**Mục đích**: Backward compatibility với SDK v1  
**Khi nào dùng**: Migrate từ SDK v1, support legacy games  

### `/src/core/game/esmBridge.ts` - ESM Bridge
**Mục đích**: Bridge cho ES modules games (non-iframe)  
**Khi nào dùng**: Games chạy như ES modules thay vì trong iframe  

### `/src/core/game/statsCore.ts` - Statistics Core
**Mục đích**: Core statistics tracking và calculation  
**Khi nào dùng**: Track detailed game statistics, analytics  

---

## 📁 `/src/core/hub/` - Hub-Side Extensions

### `/src/core/hub/index.ts` - Hub Exports
**Mục đích**: Export hub-side utilities  

### `/src/core/hub/sessionController.ts` - Session Controller
**Mục đích**: Advanced session management cho Hub  
**Khi nào dùng**: Hub cần manage multiple game sessions, complex lifecycle  

### `/src/core/hub/iframeBridge.ts` - Hub Iframe Bridge
**Mục đích**: Advanced hub-side iframe bridge  
**Khi nào dùng**: Hub embed games trong iframe với advanced features  

### `/src/core/hub/iframeBridge.v1.ts` - Legacy Hub Bridge v1
**Mục đích**: Backward compatibility với hub bridge v1  
**Khi nào dùng**: Legacy hub integration  

---

## 📁 `/src/core/phaser/` - Phaser Integration

### `/src/core/phaser/index.ts` - Phaser Exports
**Mục đích**: Export Phaser utilities và integrations  

### `/src/core/phaser/assetManager.ts` - Asset Manager
**Mục đích**: Advanced asset management cho Phaser games  
**Khi nào dùng**: Complex asset loading, preloading strategies, asset optimization  
**Features**:
- Asset preloading với progress tracking
- Asset caching và memory management
- Multiple format support (WebP fallbacks)
- Lazy loading strategies

### `/src/core/phaser/scaleManager.ts` - Scale Manager
**Mục đích**: Responsive scaling và resize handling cho Phaser  
**Khi nào dùng**: Responsive Phaser games, handle different screen sizes  
**Features**:
- Automatic scaling based on container size
- Aspect ratio preservation
- Device pixel ratio handling
- Orientation change support

### `/src/core/phaser/HowlerAudioManager.ts` - Audio Manager
**Mục đích**: Audio management sử dụng Howler.js cho cross-browser compatibility  
**Khi nào dùng**: Play music/SFX, audio controls, cross-browser audio support  
**Features**:
- Cross-browser audio support
- Volume controls (master, music, SFX)
- Audio sprite support
- Fade in/out effects
- Audio pooling for performance

### `/src/core/phaser/createEndGameScene.ts` - End Game Scene Factory
**Mục đích**: Factory function để tạo standardized end game scenes  
**Khi nào dùng**: Create consistent end game experience, results display  

### `/src/core/phaser/audio/` - Audio Utilities
#### `/src/core/phaser/audio/audioRuntime.ts` - Audio Runtime
**Mục đích**: Runtime audio management và control  
**Khi nào dùng**: Dynamic audio control during gameplay  

#### `/src/core/phaser/audio/audioSources.ts` - Audio Sources
**Mục đích**: Audio source management và streaming  
**Khi nào dùng**: Manage multiple audio sources, audio streaming  

---

## 📁 `/src/core/protocol/` - Protocol Extensions

### `/src/core/protocol/index.ts` - Protocol Exports
**Mục đích**: Export protocol extensions  

### `/src/core/protocol/protocol.ts` - Protocol Extensions
**Mục đích**: Extensions to core protocol functionality  
**Khi nào dùng**: Custom protocol handling, SDK-specific protocol features  

---

## 📁 `/src/core/runtime/` - Runtime Extensions

### `/src/core/runtime/index.ts` - Runtime Exports
**Mục đích**: Export runtime utilities  

### `/src/core/runtime/gameSessionUiRuntime.ts` - Game Session UI Runtime
**Mục đích**: UI runtime cho game sessions với advanced features  
**Khi nào dùng**: Complex game session UI, HUD management  

### `/src/core/runtime/score/` - Score Management
#### `/src/core/runtime/score/scoreTimer.ts` - Score Timer
**Mục đích**: Advanced timer cho scoring systems  
**Khi nào dùng**: Time-based scoring, countdown timers, score multipliers  

### `/src/core/runtime/state/` - State Management
#### `/src/core/runtime/state/stateClient.ts` - State Client
**Mục đích**: Client-side state management với sync capabilities  
**Khi nào dùng**: Complex state management, state synchronization  

#### `/src/core/runtime/state/stateStore.ts` - State Store
**Mục đích**: Advanced state storage và persistence  
**Khi nào dùng**: Complex state persistence, state versioning  

### `/src/core/runtime/ui/` - UI Components
#### `/src/core/runtime/ui/hudDom.ts` - HUD DOM Components
**Mục đích**: DOM-based HUD components với advanced features  
**Khi nào dùng**: Complex overlay UI, DOM-based game UI  

#### `/src/core/runtime/ui/resultOverlayDom.ts` - Result Overlay
**Mục đích**: Advanced result overlay UI  
**Khi nào dùng**: Rich result displays, animated completion screens  

---

## 📁 `/src/core/shared/` - Shared Utilities

### `/src/core/shared/sdkSpy.ts` - SDK Spy (Debug Utilities)
**Mục đích**: Debug và monitoring utilities cho SDK development  
**Khi nào dùng**: Debug SDK behavior, performance monitoring, testing  
**Features**:
- **Event Tracking**: Track SDK events với timestamps
- **Performance Monitoring**: Monitor SDK performance
- **Memory Management**: Prevent memory leaks trong debug mode
- **Categorized Logging**: Organize logs by category (sdk, stats, hub)
- **Safe Serialization**: Handle complex objects safely

**Usage Pattern**:
```typescript
import { __testSpy } from '@iruka-edu/mini-game-sdk';

// Enable debugging
__testSpy.enable();

// Get debug records
const records = __testSpy.getRecords();
const summary = __testSpy.getSummary();

// Reset debug data
__testSpy.reset();
```

---

## 📁 `/src/core/utils/` - Core Utilities

### `/src/core/utils/index.ts` - Utility Exports
**Mục đích**: Export utility functions  
**Khi nào dùng**: Common utilities, helper functions  

---

## 📁 `/src/adapters/` - Framework Adapters

### Overview
Folder cho future framework adapters (Vue, Angular, etc.). Hiện tại empty nhưng reserved cho future expansion.

**Planned Adapters**:
- Vue adapter (`VueGameHost.vue`)
- Angular adapter (`AngularGameHost.component.ts`)
- Svelte adapter (`SvelteGameHost.svelte`)

---

## 🎯 Usage Patterns

### 1. Basic React Integration
```typescript
import { IrukaGameHost, BaseGame } from '@iruka-edu/mini-game-sdk';

class MyGame extends BaseGame {
  // Game implementation
}

function App() {
  return (
    <IrukaGameHost 
      createGame={() => new MyGame()}
      config={gameConfig}
    />
  );
}
```

### 2. Phaser Game with Audio
```typescript
import { phaser } from '@iruka-edu/mini-game-sdk';

class GameScene extends Phaser.Scene {
  create() {
    // Use SDK audio manager
    const audio = new phaser.HowlerAudioManager();
    audio.playMusic('bgm');
    audio.playSFX('click');
  }
}
```

### 3. Auto-Save Integration
```typescript
import { AutoSaveManager, BaseGame } from '@iruka-edu/mini-game-sdk';

class MyGame extends BaseGame {
  private autoSave: AutoSaveManager;

  async onInit(cfg) {
    await super.onInit(cfg);
    
    this.autoSave = new AutoSaveManager(
      (state) => this.save(state),
      3000
    );
  }

  updateGameState(newState) {
    this.gameState = newState;
    this.autoSave.requestSave(newState);
  }

  onPause() {
    super.onPause();
    this.autoSave.flush(); // Force save on pause
  }
}
```

### 4. Debug và Monitoring
```typescript
import { __testSpy } from '@iruka-edu/mini-game-sdk';

// Enable debugging in development
if (process.env.NODE_ENV === 'development') {
  __testSpy.enable();
}

// Monitor SDK behavior
const summary = __testSpy.getSummary();
console.log('SDK Events:', summary);
```

### 5. Advanced Phaser Integration
```typescript
import { phaser, BaseGame } from '@iruka-edu/mini-game-sdk';

class PhaserGame extends BaseGame {
  private game: Phaser.Game;
  private assetManager: phaser.AssetManager;
  private scaleManager: phaser.ScaleManager;

  async onInit(cfg) {
    await super.onInit(cfg);
    
    this.assetManager = new phaser.AssetManager();
    this.scaleManager = new phaser.ScaleManager();
    
    // Create Phaser game with SDK integration
    this.game = new Phaser.Game({
      // Phaser config
      scene: [PreloadScene, MainScene],
      scale: this.scaleManager.getConfig()
    });
  }
}
```

---

## 🔍 When to Use Each Component

### React Components
- **`IrukaGameHost`** - Embed games trong React apps, lifecycle management

### State Management
- **`AutoSaveManager`** - Auto-save functionality, prevent data loss
- **`BaseGame`** - Standard game base class với lifecycle
- **`core.runtime.state.*`** - Complex state management needs

### Phaser Integration
- **`core.phaser.HowlerAudioManager`** - Cross-browser audio
- **`core.phaser.assetManager`** - Advanced asset loading
- **`core.phaser.scaleManager`** - Responsive scaling

### Debug & Development
- **`__testSpy`** - Debug SDK behavior, performance monitoring
- **`core.shared.*`** - Development utilities

### Framework Extensions
- **`core.game.*`** - Game-side utilities và extensions
- **`core.hub.*`** - Hub-side utilities và extensions
- **`core.runtime.*`** - Runtime utilities và UI components

---

## 📋 Architecture Principles

### Dependency Strategy
- **Depends on game-core**: Re-export all game-core functionality
- **Framework Integration**: Add React, Phaser, audio support
- **Peer Dependencies**: React, Phaser as peer deps để avoid version conflicts
- **Minimal Bundle**: Tree-shakeable exports, optional features

### Export Strategy
- **Re-export Everything**: All game-core exports available
- **Namespaced Access**: `game.*`, `phaser.*`, `runtime.*` namespaces
- **Direct Access**: Direct imports cho commonly used items
- **Backward Compatibility**: Support legacy patterns

### Extension Philosophy
- **Additive**: Add functionality without breaking game-core
- **Optional**: All extensions are optional, fallback to game-core
- **Framework-Specific**: Framework integrations in separate folders
- **Performance**: Optimize for bundle size và runtime performance

---

## 🚀 Development Guidelines

### Adding New Features
1. **Core Extensions** → Add to appropriate `/src/core/` subfolder
2. **Framework Integration** → Add to `/src/react/`, `/src/adapters/`
3. **State Management** → Add to `/src/state/`
4. **Always Export** → Update `/src/index.ts` với new exports

### Testing Strategy
- **Unit Tests** → Test SDK-specific functionality
- **Integration Tests** → Test với React, Phaser
- **E2E Tests** → Test full game lifecycle
- **Debug Tools** → Use `__testSpy` cho debugging

### Bundle Optimization
- **Tree Shaking** → Ensure all exports are tree-shakeable
- **Code Splitting** → Separate framework-specific code
- **Peer Dependencies** → Keep heavy dependencies as peers
- **Bundle Analysis** → Monitor bundle size regularly

---

## 🔄 Relationship với Game-Core

### Re-export Strategy
```typescript
// All game-core exports available through mini-game-sdk
export * from '@iruka-edu/game-core';

// Plus SDK-specific additions
export { IrukaGameHost } from './react/IrukaGameHost';
export { AutoSaveManager } from './state/AutoSaveManager';
```

### Extension Pattern
```typescript
// Extend game-core functionality
import { createIframeBridge } from '@iruka-edu/game-core';

// Add SDK-specific wrapper
export function createAdvancedBridge(options) {
  const bridge = createIframeBridge(options.onCommand);
  // Add SDK-specific features
  return enhancedBridge;
}
```

### Namespace Organization
```typescript
// Organize extensions by domain
export * as game from './core/game';      // Game-side extensions
export * as hub from './core/hub';        // Hub-side extensions  
export * as phaser from './core/phaser';  // Phaser integration
export * as runtime from './core/runtime'; // Runtime utilities
export * as core from '@iruka-edu/game-core'; // Direct access to core
```

---

**Remember**: mini-game-sdk là "batteries included" version của game-core. Provide convenience, framework integration, và advanced features while maintaining compatibility với core package!