# Submit QC API Fix - Resubmit Published Games

## Problem
The `/api/games/submit-qc` API was failing with a 400 Bad Request error when trying to submit a game that was already in "published" status:

```
"error": "Cannot submit version in \"published\" status. Only draft or qc_failed versions can be submitted."
```

## Root Cause
The original state machine only allowed transitions from `draft` or `qc_failed` statuses to `uploaded` (QC submission). There was no way to resubmit a published game for QC review, which is needed when:

1. A published game needs updates or fixes
2. A published game needs to go through QC again for compliance
3. A published game needs to be reviewed after changes

## Solution

### 1. Added Resubmit Transition to State Machine

**New Transition Added:**
```typescript
resubmit: {
  from: ['published', 'approved'],
  to: 'uploaded',
  requiredPermission: 'games:submit',
  validate: async (version: GameVersion) => {
    // Same Self-QA validation as submit
    if (!version.selfQAChecklist) return false;
    const checklist = version.selfQAChecklist;
    return (
      checklist.testedDevices === true &&
      checklist.testedAudio === true &&
      checklist.gameplayComplete === true &&
      checklist.contentVerified === true
    );
  }
}
```

### 2. Updated Submit QC API Logic

**Smart Action Detection:**
The API now automatically determines whether to use `submit` or `resubmit` based on the current version status:

```typescript
// Determine the appropriate action based on current status
let action = 'submit';
if (version.status === 'published' || version.status === 'approved') {
  action = 'resubmit';
}
```

**Enhanced Error Messages:**
Instead of hardcoded error messages, the API now shows all valid actions for the current status:

```typescript
const validActions = stateMachine.getValidActions(version.status);
return new Response(JSON.stringify({ 
  error: `Cannot submit version in "${version.status}" status. Valid actions from this status: ${validActions.join(', ') || 'none'}` 
}), { status: 400 });
```

### 3. Updated Audit Logging

**Action-Specific Logging:**
The audit log now differentiates between initial submission and resubmission:

```typescript
action: action === 'resubmit' ? 'GAME_RESUBMIT_QC' : 'GAME_SUBMIT_QC',
metadata: {
  gameId: game.gameId,
  version: version.version,
  action: action,  // Added action type for clarity
}
```

## Updated Workflow

### Original Workflow
```
draft → uploaded → qc_processing → qc_passed → approved → published
  ↑                                    ↓
  └─────────────── qc_failed ←────────┘
```

### New Workflow (with resubmit)
```
draft → uploaded → qc_processing → qc_passed → approved → published
  ↑                                    ↓                      ↓
  └─────────────── qc_failed ←────────┘                      ↓
                                                              ↓
                                    uploaded ←─────────────────┘
                                      ↓         (resubmit)
                                 qc_processing
```

## Valid Status Transitions

| Current Status | Valid Actions | Target Status |
|---------------|---------------|---------------|
| `draft` | `submit` | `uploaded` |
| `qc_failed` | `submit` | `uploaded` |
| `published` | `resubmit`, `archive` | `uploaded`, `archived` |
| `approved` | `resubmit`, `publish` | `uploaded`, `published` |
| `uploaded` | `startReview` | `qc_processing` |
| `qc_processing` | `pass`, `fail` | `qc_passed`, `qc_failed` |
| `qc_passed` | `approve` | `approved` |
| `archived` | `republish` | `published` |

## API Usage

### Submit New Game (Draft → QC)
```javascript
POST /api/games/submit-qc
{
  "gameId": "6942e6c54f2eae03b502b564"
}
```

### Resubmit Published Game (Published → QC)
```javascript
POST /api/games/submit-qc
{
  "gameId": "6942e6c54f2eae03b502b564"
}
// Same API call - automatically detects resubmit needed
```

## Requirements

**Self-QA Completion:**
Both `submit` and `resubmit` actions require complete Self-QA checklist:
- ✅ `testedDevices: true`
- ✅ `testedAudio: true`
- ✅ `gameplayComplete: true`
- ✅ `contentVerified: true`

**Permissions:**
- `games:submit` permission required for both actions
- Only game owner (dev) or admin can submit/resubmit

## Files Modified

1. **`src/lib/version-state-machine.ts`**
   - Added `resubmit` transition from `published`/`approved` to `uploaded`
   - Enhanced error messages with valid actions list

2. **`src/pages/api/games/submit-qc.ts`**
   - Smart action detection (`submit` vs `resubmit`)
   - Improved error messages
   - Enhanced audit logging with action type

## Testing Scenarios

- [x] Submit draft game → Should work (existing functionality)
- [x] Submit qc_failed game → Should work (existing functionality)
- [x] Submit published game → Should work (new resubmit functionality)
- [x] Submit approved game → Should work (new resubmit functionality)
- [x] Submit uploaded game → Should fail with helpful error message
- [x] Submit without Self-QA → Should fail with validation error
- [x] Submit as non-owner → Should fail with permission error

## Benefits

1. **Flexible Workflow**: Published games can now be resubmitted for QC
2. **Better UX**: Clear error messages showing what actions are available
3. **Audit Trail**: Distinguishes between initial submission and resubmission
4. **Backward Compatible**: Existing API calls continue to work
5. **Smart Detection**: Automatically chooses correct action based on status

This fix enables a complete game lifecycle management where games can be iteratively improved and resubmitted for quality assurance even after publication.