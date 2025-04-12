module.exports = {
    server: {
        port: 4334,
        resourcePath: "/UA/MyServer",
        buildInfo: {
            productName: "MySampleServer",
            buildNumber: "1.0.0",
            buildDate: new Date()
        },
        security: {
            securityMode: "None", // 可选值: "None", "Sign", "SignAndEncrypt"
            securityPolicy: "None", // 可选值: "None", "Basic128Rsa15", "Basic256", "Basic256Sha256"
            pkiFolder: "./pki",     // PKI 文件夹路径
            allowAnonymous: true,
            rejectUnauthorized: false
        }
    },
    variables: {
        updateInterval: 1000, // 变量更新间隔（毫秒）
        ranges: {
            temperature: { min: -20, max: 100 },
            humidity: { min: 0, max: 100 }
        }
    },
    logging: {
        level: "info",
        file: "server.log"
    }
}; 