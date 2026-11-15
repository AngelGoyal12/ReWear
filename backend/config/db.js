const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Read Aiven's SSL certificate
const caPath = path.resolve(
    __dirname,
    "..",
    process.env.DB_SSL_CA_PATH || "certs/ca.pem"
);

if (!fs.existsSync(caPath)) {
    throw new Error(`Aiven CA certificate not found at: ${caPath}`);
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: fs.readFileSync(caPath, "utf8"),
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;