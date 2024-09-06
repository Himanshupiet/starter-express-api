const mongoose = require("mongoose");
function currentSession (){
  const currentDate= new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth= currentDate.getMonth()
  let session=''
  if(currentMonth>=3){
      session = `${(currentYear).toString()}-${(currentYear+1).toString().substring(2)}`
  }else if(currentMonth<3 ){
      session = `${(currentYear-1).toString()}-${(currentYear).toString().substring(2)}`
  }
  console.log("session", session)
  return session
}

const userSchema = new mongoose.Schema({
  userInfo: {
    email: {
      type: String,
      //required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    fatherName: {
      type: String,
      //required: true,
    },
    motherName: {
      type: String,
      //required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber1: {
      type: String,
      //required: true,
    },
    phoneNumber2: {
      type: String,
      //required: true,
    },
    dob:{
      type:Date,
      required: true,
    },
    gender: {
      type: String,
    },
    class: {
      type: String,
      required: true,
    },
    roleName: {
      type: String,
      required: true,
      default: "STUDENT",
    },
    userId: {
      type: String,
      required: true,
    },
    aadharNumber: {
      type: String,
      //required: true,
    },
    roleId:{
      type: String,
      required: true
    },
    category:{
      type:String,
        //required: true,
    },
    address:{
      type:String,
    },
    address2:{
      type:String,
    },
    busService:{
      type:Boolean,
      default:false
    },
    busRouteId:{
     type:String
    },
    feeFree:{
      type:Boolean,
      default:false
    },
    reasonForFreeFee:{
      type: String,
    },
    concession:{
      type: Number,
      default: 0
    },
    admissionDate: {
      type: String,
    },
    session:{
      type:String,
      default: currentSession(),
     },
    notes:[]
  },
  document:{
    stPhoto: {
      type: String,
    },
    parentPhoto:{
      type: String,
    },
    stAadharFside:{
      type: String,
    },
    stAadharBside:{
      type:String,
    },
    p1AadharFside:{
      type: String,
    },
    p1AadharBside:{
      type:String,
    },
    p2AadharFside:{
      type: String,
    },
    p2AadharBside:{
      type:String,
    },
    birthDoc:{
      type:String,
    },
  },

  isApproved: {
    type: Boolean,
    default: false,
  },
  isPaymentReciever:{
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: false,
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
  },
});

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.set("toJSON", {
  virtuals: true,
});

userSchema.pre("save", function (next) {
  now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.userModel = mongoose.model("user", userSchema);
exports.userSchema = userSchema;
