
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const caPath = path.resolve(
    __dirname,
    "..",
    process.env.DB_SSL_CA_PATH || "certs/ca.pem"
);

// Use the certificate from the hosting environment,
// or fall back to the local certificate.
let caCertificate;

if (process.env.DB_SSL_CA) {
    caCertificate = process.env.DB_SSL_CA.replace(/\\n/g, "\n");
} else if (fs.existsSync(caPath)) {
    caCertificate = fs.readFileSync(caPath, "utf8");
} else {
    throw new Error("Aiven SSL CA certificate not found");
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: caCertificate,
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
