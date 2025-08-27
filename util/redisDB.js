const {createClient} = require('redis');
const { invoiceModel } = require('../models/invoice ');
const { counterModel } = require('../models/counter');


let redisClient;

const connectRedis = async () => {

///migrateCounters();


    if (!redisClient) {
         redisClient = createClient({
            username: 'default',
            password: process.env.REDIS_DB_PASSWORD,
            socket: {
                host: process.env.REDIS_DB_CLOUD_HOST,
                port: process.env.REDIS_DB_PORT 
            }
        });
        redisClient.on('error', (err) => {
            console.error('Redis connection error:', err);
        });

        try {
            await redisClient.connect();
            console.log('Connected to Redis');
        } catch (err) {
            console.error('Failed to connect to Redis:', err);
            redisClient = null; // Set to null if connection fails
        }
    }
    return redisClient;
};

const getRedisClient = () => {
    if (!redisClient) {
        console.warn('Redis client is not initialized. Redis operations will be skipped.');
        return null;

    }
    console.warn('Redis client is available. Redis operations will be executed.');
    return redisClient;
};

// // ====== MIGRATION FUNCTION ======
// async function migrateCounters() {
//   try {

//     // Step 1: Aggregate invoices to get max sequence per year
//     const invoices = await invoiceModel.aggregate([
//       {
//         $project: {
//           year: { $substr: ["$invoiceId", 0, 2] }, // first 2 chars = year
//           number: { $toInt: { $substr: ["$invoiceId", 2, -1] } } // rest = numeric part
//         }
//       },
//       {
//         $group: {
//           _id: "$year",
//           maxSeq: { $max: "$number" }
//         }
//       }
//     ]);

//     if (!invoices.length) {
//       console.log("⚠️ No invoices found. Nothing to migrate.");
//       process.exit(0);
//     }

//     console.log("📊 Found max invoice numbers per year:", invoices);

//     //Step 2: Seed counters collection
//     for (const item of invoices) {
//       const year = item._id;
//       const seq = item.maxSeq;

//       await counterModel.updateOne(
//         { _id: `invoice_${year}` },
//         { $set: { seq } },
//         { upsert: true }
//       );

//       console.log(`✅ Counter set for year ${year}: seq = ${seq}`);
//     }

//     console.log("🎉 Migration complete!");
//     process.exit(0);

//   } catch (err) {
//     console.error("❌ Migration failed:", err);
//     process.exit(1);
//   }
// }

module.exports = { connectRedis, getRedisClient };
