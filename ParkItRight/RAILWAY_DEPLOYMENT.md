# Railway 部署指南

## 问题解决方案

我已经修复了导致Railway连不上后端的主要问题：

### 1. ✅ CORS配置问题（已修复）
**问题**: 后端只允许localhost访问，阻止了生产环境域名
**解决**: 更新了CORS配置以允许Railway域名和其他云平台域名

### 2. ✅ 前端API配置（已修复）
**问题**: 前端在生产环境中仍然尝试连接localhost
**解决**: 前端现在会自动检测生产环境并使用正确的域名

### 3. ✅ 静态文件服务（已优化）
**问题**: 生产环境静态文件服务可能不够优化
**解决**: 添加了缓存策略和性能优化

## Railway 部署步骤

### 方法1: 一键部署（推荐）
1. 连接您的GitHub仓库到Railway
2. Railway会自动读取`railway.json`配置
3. 自动构建和部署

### 方法2: 手动配置
1. 在Railway中创建新项目
2. 连接GitHub仓库
3. 设置以下环境变量（如果需要）：
   ```
   NODE_ENV=production
   PORT=3000  # Railway会自动设置
   ```

## 验证部署

部署完成后，访问以下端点验证：

1. **健康检查**: `https://your-app.railway.app/health`
2. **API根路径**: `https://your-app.railway.app/`
3. **停车数据API**: `https://your-app.railway.app/api/parking`

## 常见问题排查

### 1. 如果仍然出现CORS错误
在Railway环境变量中添加：
```
FRONTEND_URL=https://your-app.railway.app
```

### 2. 如果API请求失败
检查Railway日志，查看：
- 服务器是否正确启动
- 端口是否正确绑定
- API路由是否正确注册

### 3. 如果静态文件无法加载
确保：
- `npm run build` 成功执行
- `dist` 目录包含构建后的文件
- `NODE_ENV=production` 已设置

## 性能优化建议

1. **启用压缩**: 已在服务器中启用gzip压缩
2. **静态文件缓存**: 已设置1天缓存
3. **请求限制**: 已实现简单的速率限制

## 环境变量配置

复制 `env.example` 到 `.env` 并根据需要修改：

```bash
# 本地开发
VITE_BACKEND_URL=http://localhost:3001

# Railway生产环境（单一部署）
# 留空，自动使用相同域名

# Railway生产环境（分离部署）
# VITE_BACKEND_URL=https://your-backend.railway.app
```

## 监控和日志

- 使用Railway控制台查看实时日志
- 监控应用性能和错误
- 设置警报（如果需要）

---

**注意**: 这些修改确保了您的应用能够在Railway上正确运行，同时保持本地开发环境的兼容性。
