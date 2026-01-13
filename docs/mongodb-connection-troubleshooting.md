# MongoDB Connection Troubleshooting

## Lỗi đã fix: Server Selection Timeout

### Vấn đề
```
MongoServerSelectionError: Server selection timed out after 5000 ms
```

### Nguyên nhân
1. **Timeout quá ngắn**: 5 giây không đủ cho một số môi trường
2. **Network latency**: Kết nối mạng chậm
3. **MongoDB server overload**: Server quá tải
4. **Connection pool issues**: Vấn đề với connection pool

### Giải pháp đã áp dụng

#### 1. **Cải thiện Connection Settings**
```typescript
const client = new MongoClient(uri, {
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 15000, // Tăng từ 5s lên 15s
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000, // Tăng từ 10s lên 15s
  heartbeatFrequencyMS: 10000,
  retryWrites: true, // Thêm retry cho writes
  retryReads: true, // Thêm retry cho reads
  compressors: ['zlib'], // Enable compression
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

#### 2. **Retry Logic với Exponential Backoff**
- 3 lần thử kết nối
- Delay tăng dần: 1s, 2s, 4s (tối đa 5s)
- Log chi tiết cho mỗi lần thử

#### 3. **Connection Health Check**
- Ping database trước khi sử dụng cached connection
- Auto-reconnect nếu connection bị stale
- Force reconnect function

#### 4. **Improved Error Handling**
- Specific error messages cho từng loại lỗi
- Retry logic trong login API
- Health check endpoint

### API Endpoints mới

#### Health Check
```bash
# Kiểm tra trạng thái MongoDB
GET /api/health/mongodb

# Force reconnect
POST /api/health/mongodb
```

#### Response format
```json
{
  "status": "healthy|unhealthy|reconnected",
  "message": "MongoDB connection is working",
  "responseTime": "150ms",
  "reconnected": false,
  "timestamp": "2024-01-13T10:30:00.000Z"
}
```

### Cách sử dụng

#### 1. **Kiểm tra connection**
```bash
curl http://localhost:3000/api/health/mongodb
```

#### 2. **Force reconnect khi có vấn đề**
```bash
curl -X POST http://localhost:3000/api/health/mongodb
```

#### 3. **Monitor logs**
```
[MongoDB] Connection attempt 1/3...
[MongoDB] Connected successfully on attempt 1 with connection pooling
```

### Environment Variables cần thiết

```env
IRUKA_MONGODB_URI=mongodb://username:password@host:port/database
```

### Troubleshooting Steps

#### Nếu vẫn gặp lỗi timeout:

1. **Kiểm tra MongoDB URI**
   ```bash
   echo $IRUKA_MONGODB_URI
   ```

2. **Test connection trực tiếp**
   ```bash
   mongosh "$IRUKA_MONGODB_URI"
   ```

3. **Kiểm tra network**
   ```bash
   ping your-mongodb-host
   telnet your-mongodb-host 27017
   ```

4. **Kiểm tra MongoDB server status**
   ```bash
   # Trong mongosh
   db.adminCommand("serverStatus")
   ```

5. **Tăng timeout nếu cần**
   ```typescript
   serverSelectionTimeoutMS: 30000, // 30 giây
   connectTimeoutMS: 30000,
   ```

### Monitoring

#### Logs để theo dõi:
- `[MongoDB] Connection attempt X/3...`
- `[MongoDB] Connected successfully...`
- `[MongoDB] Cached connection is stale, reconnecting...`
- `[MongoDB] Health check failed:`

#### Metrics quan trọng:
- Connection response time
- Retry frequency
- Health check success rate

### Best Practices

1. **Always use health check** trước khi deploy
2. **Monitor connection logs** trong production
3. **Set up alerts** cho MongoDB connection failures
4. **Use connection pooling** để tối ưu performance
5. **Implement circuit breaker** cho high-traffic applications

### Recovery Actions

Nếu gặp vấn đề:
1. Check health endpoint
2. Force reconnect nếu cần
3. Restart application nếu vấn đề persist
4. Check MongoDB server status
5. Scale MongoDB resources nếu cần