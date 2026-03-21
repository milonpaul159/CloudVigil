/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  CloudVigil — User Seeder                                 ║
 * ║  Seeds the initial hardcoded users into MongoDB           ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const User = require('../models/User');

/**
 * Initial users to seed. These match the original hardcoded credentials.
 * The User model's pre-save hook will automatically bcrypt the passwords.
 */
const INITIAL_USERS = [
  { username: 'admin', password: 'fh8ew896fg39', role: 'admin' },
  { username: 'Swarnabha', password: 'Bappa@2006', role: 'admin' },
  { username: 'Milon', password: 'Milon@2007', role: 'member' },
];

/**
 * Seeds initial users into MongoDB. Skips any that already exist.
 */
const seedUsers = async () => {
  try {
    for (const userData of INITIAL_USERS) {
      const exists = await User.findOne({ username: userData.username });
      if (!exists) {
        await User.create({
          username: userData.username,
          passwordHash: userData.password, // pre-save hook will hash this
          role: userData.role,
        });
        console.log(`   👤 Created user: ${userData.username} (${userData.role})`);
      }
    }
  } catch (err) {
    console.error('❌ User seeding error:', err.message);
  }
};

module.exports = seedUsers;
