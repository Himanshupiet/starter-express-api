const express = require("express");
const router = express.Router();
const public = require("../api/controller/public");

router.post("/userlogin", public.userlogin);
router.post("/addUser", public.addUser);
router.get("/getAllUser", public.getAllUser)
router.get("/getBlogPost/:slugTitle", public.getBlogPost)
router.get("/getAllBlogPost", public.getAllBlogPost)
module.exports = router;
