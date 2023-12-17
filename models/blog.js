const mongoose = require("mongoose")

const blogSchema = new mongoose.Schema({
    postId:{
        type: String,
        //required: true,
    },
    title:{
        type: String,
        //required: true,
    },
    postImageUrl:{
      type: String
    },
    alias:{
      type:Boolean,
      default:false
    },
    aliasUrl:{
      type:String,
    },
    altTag:{
      type:String,
    },
    blogContent:{
        type: String,
        //require: true
    },
    blogMetaTag:{
      type: String,
    },
    canonicalUrl:{
      type: String,
    },
    category:{
        type: String,
    },
    faq:{
      type: String,
    },
    metaKeyword:{
      type: String,
    },
    schemaMarkUp:{
      type: String,
    },
    tags:[],
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