const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const JSZip = require("jszip");
const userModel = require("../models/user"); // Import your Mongoose model
const paymentModel = require("../models/payment"); // Import your Mongoose model

//Local MongoDB connection
// mongoose.connect("mongodb://localhost:27017/bmms", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// Remote Mongo URl Connection
// require("dotenv/config");
// const mongoUrl = process.env.MONGO_LOCAL_CONN_URL;
// const mongoDbName = process.env.MONGO_DB_NAME;
// console.log("mongoUrl", mongoUrl)
// mongoose
//   .connect(mongoUrl, 
//     {
//     serverSelectionTimeoutMS: 9000,
//     // useNewUrlParser: true,
//     // useUnifiedTopology: true,
//     // useFindAndModify: false,
//     dbName: mongoDbName,
//   }
// )
module.exports = {
    restoreBackup: async(zipFilePath)=>{
    try {
        // Read the ZIP file
        const zipData = fs.readFileSync(zipFilePath);
        const zip = await JSZip.loadAsync(zipData);

        /** user backup */
            // Check if users.json exists in the ZIP
            // if (!zip.files["users.json"]) {
            // console.error("Error: users.json not found in ZIP.");
            // return;
            // }

            // // Read and parse users.json
            // const jsonData = await zip.files["users.json"].async("string");
            // const users = JSON.parse(jsonData);
            // //console.log("users", users)
            // console.log("Users to insert:", users.length);
            // console.log("UserModel Functions:", Object.keys(userModel)); 
            // // Restore data into MongoDB
            // await userModel.insertMany(users, { ordered: false });
        //End

        //** payment backup */

            // // Check if payments.json exists in the ZIP
            // if (!zip.files["payments.json"]) {
            // console.error("Error: payments.json not found in ZIP.");
            // return;
            // }

            // // Read and parse payments.json
            // const jsonData = await zip.files["payments.json"].async("string");
            // const payments = JSON.parse(jsonData);
            // //console.log("payments", payments)
            // console.log("payments to insert:", payments.length);
            // console.log("paymentModel Functions:", Object.keys(paymentModel)); 
            // // Restore data into MongoDB
            // await paymentModel.insertMany(payments, { ordered: false });

        //End


        

        console.log("Backup restored successfully.");
    } catch (error) {
        console.error("Error restoring backup:", error);
    } finally {
        mongoose.connection.close();
    }
    }
}

// Provide the full path to the ZIP file

