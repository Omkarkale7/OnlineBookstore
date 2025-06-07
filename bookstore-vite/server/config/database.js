const { Sequelize } = require('sequelize');

// MySQL connection configuration
const sequelize = new Sequelize('bookstore', 'root', 'root', {  // Replace 'your_password_here' with your MySQL root password
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✓ MySQL Database connection has been established successfully.');
  } catch (error) {
    console.error('✕ Unable to connect to the MySQL database. Error details:');
    console.error('- Host:', 'localhost');
    console.error('- Port:', 3306);
    console.error('- Database:', 'bookstore');
    console.error('- Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. Is MySQL server running?');
    console.error('2. Is the password correct in the configuration?');
    console.error('3. Does the database "bookstore" exist?');
    console.error('4. Is MySQL running on port 3306?');
  }
}

testConnection();

module.exports = sequelize; 