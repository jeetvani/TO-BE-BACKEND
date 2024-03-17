const mysql = require("mysql");
const { environment } = require("../config/dbConfig");
const { appLogger } = require("../config/appLogger");

async function emptyTables({ DB }) {
    const config = {
        host: environment.DB_HOST,
        user: environment.DB_USER,
        password: environment.DB_PASSWORD,
        database: DB,
    };
    const connection = mysql.createConnection(config);

    try {
        connection.connect();

        const query = `SHOW TABLES FROM ${connection.escapeId(config.database)}`;

        connection.query(query, (err, results) => {
            if (err) {
                console.error(err);
                process.exit(1); // Exit with error code
            } else {
                let remainingTables = results.length;

                results.forEach((table) => {
                    const tableName = Object.values(table)[0];
                    const emptyQuery = `DELETE FROM ${connection.escapeId(tableName)}`;

                    connection.query(emptyQuery, (err, results) => {
                        remainingTables--;

                        if (err) {
                            console.error(err);
                        } else {
                            appLogger.info(`Emptied table ${tableName}`);
                        }

                        if (remainingTables === 0) {
                            appLogger.info("All tables emptied successfully");
                            connection.end(); // Close connection
                            process.exit(0); // Exit successfully
                        }
                    });
                });
            }
        });
    } catch (err) {
        console.error(err);
        process.exit(1); // Exit with error code
    }
}

emptyTables({
    DB: "TOBE",
});
