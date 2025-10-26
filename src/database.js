import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import UserModel from './models/User.js';
import WrestlerModel from './models/Wrestler.js';
import APIUsageModel from './models/APIUsage.js';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'sqlite:wrestling_api.db';

// Create Sequelize instance
let sequelize;
if (DATABASE_URL.startsWith('sqlite')) {
  // Extract the filename from the SQLite URL
  const dbFile = DATABASE_URL.replace('sqlite:', '');
  const dbPath = path.isAbsolute(dbFile) ? dbFile : path.join(process.cwd(), dbFile);

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
  });
} else if (DATABASE_URL.startsWith('postgresql') || DATABASE_URL.startsWith('postgres')) {
  sequelize = new Sequelize(DATABASE_URL, {
    logging: false,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  // Default to SQLite in project root
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(process.cwd(), 'wrestling_api.db'),
    logging: false
  });
}

// Initialize models
const User = UserModel(sequelize);
const Wrestler = WrestlerModel(sequelize);
const APIUsage = APIUsageModel(sequelize);

// Define associations
User.hasMany(APIUsage, { foreignKey: 'user_id' });
APIUsage.belongsTo(User, { foreignKey: 'user_id' });

// Sync database
export async function initDatabase() {
  try {
    // Debug: Print the database path
    if (sequelize.options.dialect === 'sqlite') {
      console.log('SQLite database path:', sequelize.options.storage);
      console.log('Current working directory:', process.cwd());
    }

    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await sequelize.sync();
    console.log('Database synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

export { sequelize, User, Wrestler, APIUsage };
export default sequelize;
