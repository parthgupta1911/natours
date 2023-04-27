const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'must have a name'],
  },
  email: {
    type: String,
    unique: [true, 'email already in use'],
    lowercase: true,
    required: [true, 'must have email'],
    validate: [validator.isEmail, 'please provide in email format'],
  },
  photo: {
    type: String,
    deafult: 'default.jpg',
  },
  password: {
    select: false,
    type: String,
    required: [true, 'passsword is required'],
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm password'],
    validate: {
      //only works on save/create and not for update(finodone and update) as uses this
      validator: function (e1) {
        return e1 === this.password;
      },
      message: 'both passwords are not same',
    },
  },
  PasswordChangedAt: { type: Date },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});
userSchema.methods.corectPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JwtTimestap) {
  if (this.PasswordChangedAt) {
    const changedtime = parseInt(this.PasswordChangedAt.getTime() / 1000, 10);
    return JwtTimestap < changedtime;
  }
  return false; //false means password hasnt been changed after the jwt token
};
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.PasswordChangedAt = Date.now() - 1000;
  next();
});
userSchema.pre(/^find/, function (next) {
  //this points to the querry
  this.find({ active: { $ne: false } });
  next();
});
userSchema.methods.createpaswordresettoken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model('users', userSchema);
module.exports = User;
