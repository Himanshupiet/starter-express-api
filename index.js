const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");
const errorHandler = require("./util/errorHandler");
const { roleModel } = require("./models/role");
const { userModel } = require("./models/user");
const fileUpload = require('express-fileupload')
const { decryptAES} = require("./util/helper");

const bcrypt = require("bcryptjs");
const api = process.env.API_URL;
const PORT = process.env.PORT;
const mongoUrl = process.env.MONGO_LOCAL_CONN_URL;
const mongoDbName = process.env.MONGO_DB_NAME;

const SECRET = process.env.SECRET;

app.use(cors());
app.options("*", cors());

//middleware
app.use(express.json());
app.use(morgan("tiny"));
app.use(errorHandler);
app.use(fileUpload({
  //useTempFiles : true,
  tempFileDir : '/tmp/',
  limits: {fileSize: 50 * 1024 * 1024},
}));


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
const cronJob = require("./routes/cronJob");
const { passwordEncryptAES } = require("./util/helper");

app.use(`${api}/public`, public);
app.use(`${api}/role`, role);
app.use(`${api}/authorize`, authorize);
app.use(`${api}/admin`, admin);
app.use(`${api}/cron`, cronJob);
// app.use(`${api}/securitylog`, securitylog);

//Database
const connectToMongo = async() => {
await mongoose
  .connect(mongoUrl, {
    serverSelectionTimeoutMS: 9000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    dbName: mongoDbName,
  })
  .then(() => {

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
                // password: passwordEncryptAES("password removed"),
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
    //getAdmin();
  })
  .catch((err) => {
    console.log(err);
  });
}
connectToMongo()

//Server
app.listen(PORT || 3010, () => {
  console.log(`server is running http://localhost:${PORT}`);
});
