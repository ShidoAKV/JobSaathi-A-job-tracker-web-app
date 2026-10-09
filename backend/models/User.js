const mongoose = require("mongoose");

const ROLES = ["candidate", "recruiter", "admin"];
const RECRUITER_REQUEST_STATES = ["none", "pending", "approved", "rejected"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },

    role: { type: String, enum: ROLES, default: "candidate" },
    recruiterRequest: { type: String, enum: RECRUITER_REQUEST_STATES, default: "none" },
    company: { type: String, default: "" },

    phone: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    profileImage: { type: String, default: "" },
  },
  { timestamps: true }
);

/** Public-safe representation used by auth/user/admin responses. */
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    recruiterRequest: this.recruiterRequest,
    company: this.company,
  };
};

const User = mongoose.model("User", userSchema);
User.ROLES = ROLES;
User.RECRUITER_REQUEST_STATES = RECRUITER_REQUEST_STATES;

module.exports = User;
