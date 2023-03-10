const mongoose = require("mongoose")

const blogSchema = new mongoose.Schema({
    postId:{
        type: String,
        required: true,
    },
    title:{
        type: String,
        required: true,
    },
    subTitle:{
        type:String,
    },
    content:{
        type: String,
        require: true
    },
    postImageUrl:{
        type: String
    },
    tags:{
      type: JSON,
    },
    category:{
        type: String,
    },
    author:{
      type: String,
    },
    created: {
        type: Date,
    },
    modified: {
        type: Date,
    },
    deleted: {
        type: Boolean,
    default: false,
    }
})
  blogSchema.virtual("id").get(function () {
    return this._id.toHexString();
  });
  
  blogSchema.set("toJSON", {
    virtuals: true,
  });
  
  blogSchema.pre("save", function (next) {
   let now = new Date();
    this.modified = now;
    if (!this.created) {
      this.created = now;
    }
    next();
  }); 

exports.blogModel = mongoose.model("blog", blogSchema);
exports.blogSchema = blogSchema;