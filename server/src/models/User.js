/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — User Model                                  ║
 * ║  MongoDB-backed user accounts for registration & login    ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Hash password before saving if it was modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

/**
 * Compare a candidate password against the stored hash.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Return a safe user object (no password hash).
 */
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    username: this.username,
    role: this.role,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
