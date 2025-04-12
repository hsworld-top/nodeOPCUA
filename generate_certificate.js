const { OPCUAServer } = require("node-opcua");
const path = require("path");
const fs = require("fs");

async function generateCertificate() {
    const pkiDir = path.join(__dirname, "pki");
    
    // 创建 PKI 目录
    if (!fs.existsSync(pkiDir)) {
        fs.mkdirSync(pkiDir, { recursive: true });
    }

    // 创建临时服务器以生成证书
    const server = new OPCUAServer({
        port: 4334,
        resourcePath: "/UA/MyServer",
        buildInfo: {
            productName: "CertificateGenerator",
            buildNumber: "1",
            buildDate: new Date()
        },
        pkiFolder: pkiDir
    });

    try {
        await server.initialize();
        console.log("Certificate generated successfully");
        console.log("PKI folder:", pkiDir);
    } catch (err) {
        console.error("Error during certificate generation:", err);
    } finally {
        await server.shutdown();
    }
}

generateCertificate().catch(err => {
    console.error("Error:", err);
    process.exit(1);
}); 