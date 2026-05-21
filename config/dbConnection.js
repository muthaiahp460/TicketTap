const db=require('mysql2/promise');
require('dotenv').config()

const pool=db.createPool({
        host:process.env.host,
        user:process.env.user,
        password:process.env.password,
        database:process.env.database,
        port:process.env.port,
        connectionLimit: 50,
        waitForConnections: true,
        enableKeepAlive: true,
        keepAliveInitialDelayMs: 0
    }
)

module.exports={pool}