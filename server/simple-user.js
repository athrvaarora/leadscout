require('dotenv').config();
const { sequelize } = require('./config/database');
const bcrypt = require('bcryptjs');

async function createSimpleUser() {
  try {
    // Delete existing user first
    await sequelize.query(`DELETE FROM "Users" WHERE email = 'simple@example.com'`);
    
    // Generate a fresh hash
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('simple123', salt);
    console.log('Generated hash:', hash);
    
    // Manually insert a user bypassing Sequelize hooks
    const result = await sequelize.query(`
      INSERT INTO "Users" (
        id, name, email, password, company, role, "createdAt", "updatedAt"
      ) VALUES (
        uuid_generate_v4(), 'Simple User', 'simple@example.com', '${hash}', 
        'Test Company', 'user', NOW(), NOW()
      ) RETURNING id, email;
    `);
    
    console.log('User created:', result[0][0]);
    console.log('Login with:');
    console.log('Email: simple@example.com');
    console.log('Password: simple123');
    
    // Test the hash directly with bcrypt
    const testHash = result[0][0].password || hash;
    const isMatch = await bcrypt.compare('simple123', testHash);
    console.log('Direct bcrypt verification:', isMatch);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

createSimpleUser();