const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const CronJob = require("cron").CronJob;
const cron = require("node-cron");
require("dotenv/config");
const moment = require("moment-timezone");
const errorHandler = require("./util/errorHandler");
const { roleModel } = require("./models/role");
const { userModel } = require("./models/user");
const { cronjobModel } = require("./models/cronjob");

const { decryptAES } = require("./util/helper");

const bcrypt = require("bcryptjs");
const api = process.env.API_URL;
const PORT = process.env.PORT;
const mongoUrl = process.env.MONGO_LOCAL_CONN_URL;
const mongoDbName = process.env.MONGO_DB_NAME;
const secrets = process.env.secret;

app.use(cors());
app.options("*", cors());

//middleware
app.use(express.json());
app.use(morgan("tiny"));
app.use(errorHandler);

app.get("/", (req, res) => res.json({ message: "Home Page  test Route" }));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "DELETE, PUT, GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

//controller
const public = require("./routes/public");
const role = require("./routes/role");
const authorize = require("./routes/authorize");
const admin = require("./routes/admin");
const user = require("./routes/user");
const securitylog = require("./routes/secuirtylog");
const { passwordEncryptAES } = require("./util/helper");

app.use(`${api}/public`, public);
app.use(`${api}/role`, role);
app.use(`${api}/authorize`, authorize);
app.use(`${api}/admin`, admin);
// app.use(`${api}/user`, user);
// app.use(`${api}/securitylog`, securitylog);

//Database
mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    dbName: mongoDbName,
  })
  .then(() => {


    
    console.log(decryptAES("U2FsdGVkX1+izMKtCzWgd3zqakPXE+TfI7DESPS753Q="))
    console.log("Database Connection is ready...");

    const getAdmin = async () => {
      try {
        let topAdminRoleId = "";
        const topAdminRole = await roleModel.findOne({ roleName: "TOPADMIN" });
        if (topAdminRole) {
          topAdminRoleId = topAdminRole._id;
        } else {
          let newTopAdminRole = new Role({
            roleName: "TOPADMIN",
          });
          const newTopAdminRoleCreated = await newTopAdminRole.save();
          topAdminRoleId = newTopAdminRoleCreated._id;
        }
        if (topAdminRoleId) {
          const topAdminUser = await userModel.findOne({
            "userInfo.email": "topadmin@bmmshool.in",
          });
          if (!topAdminUser) {
            const newTopAdmin = new userModel({
              userInfo: {
                userId: "000000",
                email: "topadmin@bmmshool.in",
                fullName: "TopAdmin",
                motherName:"1",
                fatherName:"1",
                class:"1",
                dob:new Date(),
                password: passwordEncryptAES("topadmin@%$#"),
                phoneNumber1: "1234567890",
                roleId: topAdminRoleId,
                roleName: "TOPADMIN",
              },
              isActive: true,
              isApproved:true
            });
            newTopAdminCreated = await newTopAdmin.save();
          }
        }
      } catch (err) {
        console.log(err);
      }
    };
    getAdmin();
  })
  .catch((err) => {
    console.log(err);
  });

//Server
app.listen(PORT || 3010, () => {
  console.log(`server is running http://localhost:${PORT}`);
});
