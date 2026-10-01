const path = require('path');

// Always load the backend environment file, regardless of whether the server
// is started from the repository root or from the backend directory.
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  await connectDB();
  // Ensure provider IDs are unique before accepting Google registrations.
  await require('./src/models/User').init();
  await require('./src/models/AuthChallenge').init();
  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});
