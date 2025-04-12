const { OPCUAClient, MessageSecurityMode, SecurityPolicy, Variant, DataType, AttributeIds } = require("node-opcua");
const config = require("./config");
const winston = require("winston");

// 配置日志记录器
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console()
    ]
});

async function testClient() {
    // 创建客户端
    const client = OPCUAClient.create({
        endpointMustExist: false,
        securityMode: MessageSecurityMode.None,
        securityPolicy: SecurityPolicy.None,
        connectionStrategy: {
            maxRetry: 3,
            initialDelay: 1000,
            maxDelay: 5000
        },
        keepSessionAlive: true
    });

    try {
        // 连接到服务器
        logger.info("Connecting to server...");
        const endpointUrl = `opc.tcp://localhost:${config.server.port}${config.server.resourcePath}`;
        logger.info(`Attempting to connect to: ${endpointUrl}`);
        
        await client.connect(endpointUrl);
        logger.info("Connected to server");

        // 获取服务器端点信息
        const endpoints = await client.getEndpoints();
        logger.info("Available endpoints:");
        endpoints.forEach((endpoint, index) => {
            logger.info(`Endpoint ${index + 1}:`);
            logger.info(`  URL: ${endpoint.endpointUrl}`);
            logger.info(`  Security Mode: ${endpoint.securityMode}`);
            logger.info(`  Security Policy: ${endpoint.securityPolicyUri}`);
        });

        // 等待服务器完全初始化
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 创建匿名会话
        logger.info("Creating anonymous session...");
        const session = await client.createSession({
            userIdentity: {
                type: "anonymous"
            }
        });
        logger.info("Anonymous session created");

        // 读取变量
        const nodesToRead = [
            { nodeId: "ns=1;s=Temperature" },
            { nodeId: "ns=1;s=Humidity" },
            { nodeId: "ns=1;s=HostName" },
            { nodeId: "ns=1;s=Uptime" },
            { nodeId: "ns=1;s=CPUUsage" }
        ];

        logger.info("Reading variables...");
        const dataValues = await session.read(nodesToRead);
        logger.info("Read values:");
        dataValues.forEach((value, index) => {
            logger.info(`${nodesToRead[index].nodeId}: ${value.value.value}`);
        });

        // 写入变量
        const nodesToWrite = [
            {
                nodeId: "ns=1;s=Temperature",
                attributeId: AttributeIds.Value,
                value: {
                    value: new Variant({ dataType: DataType.Double, value: 25.0 })
                }
            },
            {
                nodeId: "ns=1;s=Humidity",
                attributeId: AttributeIds.Value,
                value: {
                    value: new Variant({ dataType: DataType.Double, value: 60.0 })
                }
            }
        ];

        logger.info("Writing variables...");
        const results = await session.write(nodesToWrite);
        logger.info("Write results:");
        results.forEach((result, index) => {
            logger.info(`${nodesToWrite[index].nodeId}: ${result.toString()}`);
        });

        // 再次读取变量以验证写入
        logger.info("Reading variables again to verify changes...");
        const newValues = await session.read(nodesToRead);
        logger.info("New values after write:");
        newValues.forEach((value, index) => {
            logger.info(`${nodesToRead[index].nodeId}: ${value.value.value}`);
        });

        // 关闭会话
        await session.close();
        logger.info("Session closed");

    } catch (err) {
        logger.error("Error:", err);
        if (err.message.includes("Server end point are not known yet")) {
            logger.error("Server may not be fully initialized. Please ensure the server is running and try again.");
        }
    } finally {
        // 断开连接
        await client.disconnect();
        logger.info("Disconnected from server");
    }
}

// 运行测试
testClient().catch(err => {
    logger.error("Test failed:", err);
    process.exit(1);
}); 