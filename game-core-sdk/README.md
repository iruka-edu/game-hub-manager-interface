# @iruka/game-core-sdk

Core SDK for Iruka game validation, metadata types, and runtime protocols.

## Overview

This package provides pure TypeScript functions and types for:

- **Game Metadata Validation**: Dual validation system supporting draft and publish contexts
- **Type Definitions**: Comprehensive TypeScript interfaces for game metadata and validation results
- **Utility Functions**: Metadata completeness calculation and compliance checking
- **Runtime Protocols**: Iframe-based communication between games and host applications

## Installation

```bash
npm install @iruka/game-core-sdk
```

## Quick Start

### Basic Metadata Validation

```typescript
import { validateMetadata, GameMetadata } from '@iruka/game-core-sdk';

const metadata: GameMetadata = {
  gameType: 'quiz',
  subject: 'Math',
  grade: 5,
  thumbnailUrl: 'https://example.com/thumbnail.png'
};

// Validate for draft (permissive)
const draftResult = validateMetadata(metadata, 'draft');

// Validate for publishing (strict)
const publishResult = validateMetadata(metadata, 'publish');

if (publishResult.isValid) {
  console.log('Ready to publish!');
} else {
  console.log('Validation errors:', publishResult.errors);
}
```

### Completeness Tracking

```typescript
import { calculateCompleteness, getMissingFields } from '@iruka/game-core-sdk';

const requiredFields = ['gameType', 'subject', 'grade', 'thumbnailUrl'];
const completeness = calculateCompleteness(metadata, requiredFields);
const missing = getMissingFields(metadata, requiredFields);

console.log(`Metadata is ${completeness}% complete`);
console.log('Missing fields:', missing);
```

### Game Runtime Communication

```typescript
// In the host application
import { GameHost } from '@iruka/game-core-sdk/runtime';

const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
const host = new GameHost(iframe, 'https://games.iruka.com');

host.addEventListener('score:update', (event) => {
  console.log('Score updated:', event.data.score);
});

// In the game (iframe)
import { GameClient } from '@iruka/game-core-sdk/runtime';

const client = new GameClient('https://hub.iruka.com');
client.initialize({ version: '1.0.0', capabilities: ['score', 'levels'] });

// Send score update
client.updateScore(100, 200, 10);
```

## API Reference

### Types

- `GameMetadata` - Enhanced metadata interface with MF-01 fields
- `ValidationResult` - Complete validation result with errors and warnings
- `ValidationContext` - 'draft' | 'publish' validation contexts
- `MetadataCompleteness` - Detailed completeness information

### Validation Functions

- `validateMetadata(metadata, context, options?)` - Core validation function
- `validateField(fieldName, value, context)` - Individual field validation

### Utility Functions

- `calculateCompleteness(metadata, requiredFields)` - Calculate completeness percentage
- `getMissingFields(metadata, requiredFields)` - Get missing required fields
- `isMetadataComplete(metadata, requiredFields)` - Check if metadata is complete

### Runtime Classes

- `GameHost` - Host-side iframe communication manager
- `GameClient` - Client-side iframe communication manager
- `GameEventType` - Enum of all supported event types

## Schema Versions

The SDK supports schema versioning for backward compatibility:

- **Version 1**: Initial enhanced metadata schema (MF-01)
  - Required fields: `gameType`, `subject`, `grade`, `thumbnailUrl`
  - Educational fields: `lessonNo`, `lessonSummary`, `textbook`
  - Categorization: `theme_primary`, `theme_secondary`, `context_tags`, `difficulty_levels`

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:coverage
```

### Local Development

```bash
npm link
cd ../your-project
npm link @iruka/game-core-sdk
```

## License

MIT