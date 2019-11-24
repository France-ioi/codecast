const mysql = require('mysql');

function getDB (config) {
    return new Promise((resolve, reject) => {
        const db = mysql.createConnection(config.database);
        db.connect(async function (err) {
            if (err) reject(err);
            try {
                resolve(db);
            } catch (err) {
                console.error('Statistics:DB:Connect: failed', err);
                reject(new Error('DB Connection Error'));
            }
        });
    });
}

export async function logCodecastLoadData (config, logData) {
    try {
        const db = await getDB(config);
        const {codecast, name, folder, bucket, viewed, referer, browser, language, resolution} = logData;
        const query = `
        INSERT INTO \`statistics_logs\`(
            \`codecast\`,
            \`name\`,
            \`folder\`,
            \`bucket\`,
            \`viewed\`,
            \`referer\`,
            \`browser\`,
            \`language\`,
            \`resolution\`
        ) VALUES (?,?,?,?,?,?,?,?,?)`;

        db.query(query, [
            codecast,
            name,
            folder,
            bucket,
            viewed,
            referer,
            browser,
            language,
            resolution
        ], function (err) {
            db.end();
            if (err) {
                console.error('Statistics:DB:Codecast:Log:Query failed', err);
            }
        });
    } catch (err) {
        console.error('Statistics:DB:Codecast:Log failed', err);
    }
}

export async function logCompileData (config, logData) {
    try {
        const db = await getDB(config);
        const {folder = 'none', compile_time, referer} = logData;
        const query = `
            INSERT INTO \`statistics_logs\`(
                \`name\`,
                \`folder\`,
                \`compiled\`,
                \`compile_time\`,
                \`referer\`
            ) VALUES (?,?,?,?,?)
        `;

        db.query(query, [
            'sandbox',
            folder || 'none',
            1,
            compile_time,
            referer
        ], function (err) {
            db.end();
            if (err) {
                console.error('Statistics:DB:Codecast:Log:Query failed', err);
            }
        });
    } catch (err) {
        console.error('Statistics:DB:Codecast:Log failed', err);
    }
}

export function statisticsSearch (config, params) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB(config);
            let whereQueryParts = [];
            if (params.folder) {
                const [bucket, folder] = params.folder;
                whereQueryParts.push(`\`folder\` = '${folder}' AND (\`bucket\` = '${bucket}' OR \`bucket\` = 'none')`);
            }
            if (params.prefix) {
                whereQueryParts.push(`\`NAME\` LIKE '%${params.prefix}%'`);
            }
            if (params.dateRange) {
                const [start, end] = params.dateRange;
                if (start && end) {
                    whereQueryParts.push(`\`date_time\` BETWEEN '${start}' AND '${end}'`);
                }
            }

            const sqlQuery = `
            SELECT
                ANY_VALUE(\`codecast\`) AS \`codecast\`,
                \`name\`,
                DATE_FORMAT(ANY_VALUE(\`date_time\`), '%e %b %Y') AS \`date_time\`,
                \`folder\`,
                \`bucket\`,
                SUM(\`viewed\`) AS \`views\`,
                SUM(\`compiled\`) AS \`compiles\`,
                SUM(\`compile_time\`) AS \`compile_time\`
            FROM \`statistics_logs\`
            ${whereQueryParts.length !== 0 ? 'WHERE ' + whereQueryParts.join(' AND ') : ''}
            GROUP BY
                \`name\`,
                \`folder\`,
                \`bucket\`
            `;

            db.query(sqlQuery, [], function (err, rows) {
                db.end();
                if (err) {
                    console.error('Statistics:DB:Search:Query failed', err);
                    reject('Statistics DB Search Query failed');
                } else {
                    const data = [];
                    for (let row of rows) {
                        data.push({
                            codecast: row.codecast,
                            name: row.name,
                            date_time: row.date_time,
                            folder: row.folder,
                            bucket: row.bucket,
                            views: row.views,
                            compiles: row.compiles,
                            compile_time: row.compile_time,
                        });
                    }
                    resolve({data});
                }
            });
        } catch (err) {
            console.error('Statistics:Search failed', err);
            reject('Statistics Search failed');
        }
    });
}



