import { sequelize } from "../src/database.js";

async function addGradeColumn() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    const queryInterface = sequelize.getQueryInterface();
    const dialect = sequelize.getDialect();

    // Check if column already exists
    const tableDescription = await queryInterface.describeTable("wrestlers");

    if (tableDescription.grade) {
      console.log("Grade column already exists. Migration skipped.");
      await sequelize.close();
      return;
    }

    console.log("Adding grade column to wrestlers table...");

    if (dialect === "postgres") {
      // For PostgreSQL: Create ENUM type first, then add column
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_wrestlers_grade AS ENUM ('FR', 'SO', 'JR', 'SR');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await sequelize.query(`
        ALTER TABLE wrestlers
        ADD COLUMN grade enum_wrestlers_grade;
      `);
    } else if (dialect === "sqlite") {
      // For SQLite: Just add the column as TEXT
      // SQLite doesn't support ENUM, but we can add CHECK constraint
      await sequelize.query(`
        ALTER TABLE wrestlers
        ADD COLUMN grade TEXT CHECK(grade IN ('FR', 'SO', 'JR', 'SR'));
      `);
    }

    console.log("Grade column added successfully!");

    // Verify the change
    const updatedDescription = await queryInterface.describeTable("wrestlers");
    console.log("Updated table structure:", Object.keys(updatedDescription));

    await sequelize.close();
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

addGradeColumn();
