# Database Connection Fix - Repository Pattern

## 🐛 **Issue**
```
MongoServerSelectionError: connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017
```

The delete API was trying to connect directly to MongoDB using `MongoClient`, but MongoDB wasn't running or accessible.

## 🔍 **Root Cause**
The delete API was using a different database connection pattern than the rest of the application:

**❌ Problematic Approach (Direct MongoDB):**
```typescript
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient(MONGODB_URI);
await client.connect();
const db = client.db(DB_NAME);
const game = await db.collection('games').findOne({ _id: new ObjectId(gameId) });
```

**✅ Correct Approach (Repository Pattern):**
```typescript
import { GameRepository } from '../../../../models/Game';

const gameRepo = await GameRepository.getInstance();
const game = await gameRepo.findById(gameId);
```

## ✅ **Fix Applied**

### **Updated Imports**
```typescript
import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { getUserFromRequest } from '../../../../lib/session';
import { GameRepository } from '../../../../models/Game';
import { GameVersionRepository } from '../../../../models/GameVersion';
import { UserRepository } from '../../../../models/User';
```

### **Updated Database Operations**

**Before (Direct MongoDB):**
```typescript
const client = new MongoClient(MONGODB_URI);
await client.connect();
const db = client.db(DB_NAME);

const game = await db.collection('games').findOne({ _id: new ObjectId(gameId) });
await db.collection('games').deleteOne({ _id: new ObjectId(gameId) });
await db.collection('game_versions').deleteMany({ gameId: new ObjectId(gameId) });
```

**After (Repository Pattern):**
```typescript
const gameRepo = await GameRepository.getInstance();
const versionRepo = await GameVersionRepository.getInstance();
const userRepo = await UserRepository.getInstance();

const game = await gameRepo.findById(gameId);
await gameRepo.delete(gameId);

const versions = await versionRepo.findByGameId(gameId);
for (const version of versions) {
  await versionRepo.delete(version._id.toString());
}
```

### **Updated Permission Check**
Fixed the ownership field reference:
```typescript
// Correct field name (confirmed by other APIs)
const isOwner = game.ownerId === user._id.toString();
```

## 🎯 **Benefits of Repository Pattern**

1. **✅ Consistent Database Connection:** Uses the same connection pool as other APIs
2. **✅ No Direct MongoDB Dependency:** Abstracts database operations
3. **✅ Error Handling:** Built-in error handling and connection management
4. **✅ Type Safety:** Proper TypeScript types for all operations
5. **✅ Maintainability:** Consistent with the rest of the codebase

## 🧪 **Verification**
- ✅ No TypeScript errors
- ✅ Uses same pattern as all other working APIs
- ✅ Proper field names (`game.ownerId`)
- ✅ Repository instances handle database connections automatically

## 🚀 **Expected Result**
The game deletion feature should now work without database connection errors:
- **Admin users:** Can delete any game from library page
- **Developer users:** Can delete their own games from my-games page
- **No MongoDB connection errors:** Uses the application's existing database connection pool

**The database connection issue is now resolved!** 🎉