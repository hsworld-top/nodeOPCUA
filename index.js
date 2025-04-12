const {
    OPCUAServer,
    MessageSecurityMode,
    SecurityPolicy,
    StatusCodes,
    Variant,
    DataType,
    standardUnits,
    makeAccessLevelFlag,
    AccessLevelFlag
} = require("node-opcua");
const os = require("os");
const config = require("./config");
const winston = require("winston");
const path = require("path");
const fs = require("fs");

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

// 确保 PKI 目录存在
const pkiDir = path.join(__dirname, "pki");
if (!fs.existsSync(pkiDir)) {
    fs.mkdirSync(pkiDir, { recursive: true });
}

// 创建 OPC UA 服务器实例
const server = new OPCUAServer({
    port: config.server.port,
    resourcePath: config.server.resourcePath,
    buildInfo: {
        productName: "NodeOPCUA Server",
        buildNumber: "1.0.0",
        buildDate: new Date()
    },
    serverInfo: {
        applicationUri: "urn:DESKTOP-JBEMFS0:NodeOPCUA-Server",
        productUri: "urn:NodeOPCUA:Server",
        applicationName: { text: "NodeOPCUA Server", locale: "en" }
    },
    securityModes: [MessageSecurityMode.None],
    securityPolicies: [SecurityPolicy.None],
    allowAnonymous: true,
    pkiFolder: pkiDir
});

// 服务器启动前的初始化
server.initialize()
    .then(() => {
        const addressSpace = server.engine.addressSpace;
        const namespace = addressSpace.getOwnNamespace();

        // 创建设备对象
        const device = namespace.addObject({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "MyDevice"
        });

        // 添加温度变量
        let temperature = 25.0;
        const temperatureNode = namespace.addVariable({
            componentOf: device,
            browseName: "Temperature",
            nodeId: "ns=1;s=Temperature",
            dataType: "Double",
            accessLevel: AccessLevelFlag.CurrentRead | AccessLevelFlag.CurrentWrite,
            userAccessLevel: AccessLevelFlag.CurrentRead | AccessLevelFlag.CurrentWrite,
            minimumSamplingInterval: 100,
            value: {
                get: () => new Variant({ dataType: DataType.Double, value: temperature }),
                set: (variant) => {
                    temperature = parseFloat(variant.value);
                    logger.info(`Temperature set to ${temperature}`);
                    return StatusCodes.Good;
                }
            }
        });

        // 添加湿度变量
        let humidity = 60.0;
        const humidityNode = namespace.addVariable({
            componentOf: device,
            browseName: "Humidity",
            nodeId: "ns=1;s=Humidity",
            dataType: "Double",
            accessLevel: AccessLevelFlag.CurrentRead | AccessLevelFlag.CurrentWrite,
            userAccessLevel: AccessLevelFlag.CurrentRead | AccessLevelFlag.CurrentWrite,
            minimumSamplingInterval: 100,
            value: {
                get: () => new Variant({ dataType: DataType.Double, value: humidity }),
                set: (variant) => {
                    humidity = parseFloat(variant.value);
                    logger.info(`Humidity set to ${humidity}`);
                    return StatusCodes.Good;
                }
            }
        });

        // 添加主机名变量（只读）
        namespace.addVariable({
            componentOf: device,
            browseName: "HostName",
            nodeId: "ns=1;s=HostName",
            dataType: "String",
            accessLevel: AccessLevelFlag.CurrentRead,
            userAccessLevel: AccessLevelFlag.CurrentRead,
            minimumSamplingInterval: 1000,
            value: {
                get: () => new Variant({ dataType: DataType.String, value: os.hostname() })
            }
        });

        // 添加运行时间变量（只读）
        namespace.addVariable({
            componentOf: device,
            browseName: "Uptime",
            nodeId: "ns=1;s=Uptime",
            dataType: "UInt32",
            accessLevel: AccessLevelFlag.CurrentRead,
            userAccessLevel: AccessLevelFlag.CurrentRead,
            minimumSamplingInterval: 100,
            value: {
                get: () => new Variant({ dataType: DataType.UInt32, value: process.uptime() })
            }
        });

        // 添加 CPU 使用率变量（只读）
        namespace.addVariable({
            componentOf: device,
            browseName: "CPUUsage",
            nodeId: "ns=1;s=CPUUsage",
            dataType: "Double",
            accessLevel: AccessLevelFlag.CurrentRead,
            userAccessLevel: AccessLevelFlag.CurrentRead,
            minimumSamplingInterval: 100,
            value: {
                get: () => new Variant({ dataType: DataType.Double, value: os.loadavg()[0] })
            }
        });

        logger.info("Address space initialized successfully");

        // 启动服务器
        return server.start();
    })
    .then(() => {
        const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        logger.info("Server is now listening on port " + server.endpoints[0].port);
        logger.info("Primary server endpoint URL is " + endpointUrl);

        // 记录所有可用的端点
        server.endpoints.forEach((endpoint, index) => {
            const endpointDescription = endpoint.endpointDescriptions()[0];
            logger.info(`Endpoint ${index + 1}:`);
            logger.info(`  URL: ${endpointDescription.endpointUrl}`);
            logger.info(`  Security Mode: ${endpointDescription.securityMode}`);
            logger.info(`  Security Policy: ${endpointDescription.securityPolicyUri}`);
        });

        // 定期更新变量值
        setInterval(() => {
            temperature = 25.0 + Math.random() * 5;
            humidity = 60.0 + Math.random() * 10;
        }, 1000);
    })
    .catch((err) => {
        logger.error("Error during server initialization:", err);
        process.exit(1);
    });

// 处理服务器关闭
process.on("SIGINT", async () => {
    logger.info("Shutting down server...");
    try {
        await server.shutdown();
        logger.info("Server shutdown completed");
        process.exit(0);
    } catch (err) {
        logger.error("Error during server shutdown:", err);
        process.exit(1);
    }
});
  