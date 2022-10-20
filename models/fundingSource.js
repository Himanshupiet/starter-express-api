const mongoose = require("mongoose");

const fundingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  roiId: {
    type: String,
    required: true,
  },
  bankingInformation: {
    accountHolderName: {
      type: String,
    },
    bankName: {
      type: String,
    },
    ifscCode: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
  },
  balance: {
    wallet: {
      type: Number,
      default: 0,
    },
  },
  roiIncome: [
    {
      date: {
        type: Date,
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
  ],
  roilevel1Income: [
    {
      date: {
        type: Date,
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
  ],
  roilevel2Income: [
    {
      date: {
        type: Date,
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
  ],
  roilevel3to10Income: [
    {
      level: {
        type: String,
      },
      roiId: {
        type: String,
      },
      date: {
        type: Date,
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
  ],
  withDrawalHistory: [
    {
      date: {
        type: Date,
      },
      actualAmount: {
        type: Number,
        default: 0,
      },
      amount: {
        type: Number,
        default: 0,
      },
      status: {
        type: Boolean,
        default: false,
      },
      paidDate: {
        type: Date,
      },
    },
  ],
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

fundingSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

fundingSchema.set("toJSON", {
  virtuals: true,
});

fundingSchema.pre("save", function (next) {
  now = new Date();
  this.modified = now;
  if (!this.created) {
    this.created = now;
  }
  next();
});

exports.FundingSource = mongoose.model("FundingSource", fundingSchema);
exports.fundingSchema = fundingSchema;
