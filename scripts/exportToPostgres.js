/**
 * Script to export SQLite data to PostgreSQL
 * Usage: DATABASE_URL=postgresql://... node scripts/exportToPostgres.js
 */
import { Sequelize } from 'sequelize';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import UserModel from '../src/models/User.js';
import WrestlerModel from '../src/models/Wrestler.js';
import APIUsageModel from '../src/models/APIUsage.js';

async function exportToPostgres() {
  console.log('SQLite to PostgreSQL Migration Script');
  console.log('='.repeat(60));

  // Check for PostgreSQL URL
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgres')) {
    console.error('❌ Error: DATABASE_URL environment variable must be set to a PostgreSQL connection string');
    console.log('\nExample:');
    console.log('  DATABASE_URL=postgresql://user:pass@host:5432/dbname node scripts/exportToPostgres.js');
    process.exit(1);
  }

  // SQLite connection
  const sqlitePath = path.join(process.cwd(), 'wrestling_api.db');
  console.log(`\n📁 Reading from SQLite: ${sqlitePath}`);

  const db = new sqlite3.Database(sqlitePath);
  const dbAll = promisify(db.all.bind(db));

  // PostgreSQL connection
  console.log(`\n🐘 Connecting to PostgreSQL...`);
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: false,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established');

    // Initialize models
    const User = UserModel(sequelize);
    const Wrestler = WrestlerModel(sequelize);
    const APIUsage = APIUsageModel(sequelize);

    // Define associations
    User.hasMany(APIUsage, { foreignKey: 'user_id' });
    APIUsage.belongsTo(User, { foreignKey: 'user_id' });

    // Sync schema
    console.log('\n📊 Creating PostgreSQL schema...');
    await sequelize.sync({ force: true }); // WARNING: This drops existing tables
    console.log('✅ Schema created');

    // Export Wrestlers
    console.log('\n🤼 Migrating Wrestlers...');
    const wrestlers = await dbAll('SELECT * FROM Wrestlers');
    if (wrestlers && wrestlers.length > 0) {
      await Wrestler.bulkCreate(wrestlers);
      console.log(`✅ Migrated ${wrestlers.length} wrestlers`);
    } else {
      console.log('⚠️  No wrestlers found in SQLite database');
    }

    // Export Users
    console.log('\n👤 Migrating Users...');
    const users = await dbAll('SELECT * FROM Users');
    if (users && users.length > 0) {
      await User.bulkCreate(users);
      console.log(`✅ Migrated ${users.length} users`);
    } else {
      console.log('⚠️  No users found in SQLite database');
    }

    // Export API Usage
    console.log('\n📈 Migrating API Usage...');
    const apiUsage = await dbAll('SELECT * FROM APIUsages');
    if (apiUsage && apiUsage.length > 0) {
      await APIUsage.bulkCreate(apiUsage);
      console.log(`✅ Migrated ${apiUsage.length} API usage records`);
    } else {
      console.log('⚠️  No API usage records found in SQLite database');
    }

    // Verify migration
    console.log('\n✅ Migration complete!');
    console.log('\n📊 Final counts in PostgreSQL:');
    console.log(`   Wrestlers: ${await Wrestler.count()}`);
    console.log(`   Users: ${await User.count()}`);
    console.log(`   API Usage: ${await APIUsage.count()}`);

    console.log('\n🎉 Success! Your data has been migrated to PostgreSQL.');
    console.log('\nNext steps:');
    console.log('1. Set DATABASE_URL in Railway environment variables');
    console.log('2. Redeploy your app on Railway');
    console.log('3. Your data will now persist across deployments!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    db.close();
    await sequelize.close();
  }
}

exportToPostgres();
