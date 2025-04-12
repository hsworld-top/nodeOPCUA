# Node OPC UA Server

这是一个基于 Node.js 的 OPC UA 服务器实现，提供了模拟设备的数据访问功能。

## 功能特点

- 支持 OPC UA 标准协议
- 提供模拟设备数据（温度、湿度等）
- 支持服务器状态监控（CPU 使用率、运行时间等）
- 完整的日志记录
- 优雅的启动和关闭处理
- 可配置的安全选项

## 安装

```bash
# 安装依赖
npm install

# 开发模式运行（支持热重载）
npm run dev

# 生产模式运行
npm start
```

## 配置

配置文件 `config.js` 包含以下可配置项：

- 服务器端口和资源路径
- 变量更新间隔
- 变量值范围限制
- 日志级别和输出文件
- 安全配置：
  - securityMode: 安全模式（"None", "Sign", "SignAndEncrypt"）
  - securityPolicy: 安全策略（"None", "Basic128Rsa15", "Basic256", "Basic256Sha256"）
  - certificateFile: 证书文件路径（null 表示自动生成）
  - privateKeyFile: 私钥文件路径（null 表示自动生成）

## 安全说明

默认情况下，服务器使用无安全模式（None）运行，适合开发和测试环境。在生产环境中，建议配置适当的安全模式：

1. 使用 Sign 模式进行消息签名
2. 使用 SignAndEncrypt 模式进行消息签名和加密
3. 配置有效的证书和私钥文件

## 可用变量

服务器提供以下变量：

1. Temperature (Double)
   - 可读写
   - 范围：-20°C 到 100°C

2. Humidity (Double)
   - 可读写
   - 范围：0% 到 100%

3. HostName (String)
   - 只读
   - 服务器主机名

4. Uptime (Double)
   - 只读
   - 服务器运行时间（秒）

5. CPUUsage (Double)
   - 只读
   - CPU 使用率

## 连接信息

服务器默认监听端口：4334

OPC UA 端点 URL 将在服务器启动时显示在控制台中。

## 许可证

ISC 