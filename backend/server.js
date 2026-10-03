const path = require('path');

// Always load the backend environment file, regardless of whether the server
// is started from the repository root or from the backend directory.
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('./src/config/env').validateEnv();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;
let server;

// Every few minutes: cancel unpaid online orders and free expired lucky-draw ticket holds
const startHousekeeping = () => {
  const { expireUnpaidOrders } = require('./src/services/orderLifecycle');
  const { expireStalePurchases } = require('./src/services/paymentService');
  const run = () => Promise.all([expireUnpaidOrders(), expireStalePurchases()])
    .catch((err) => console.error('[housekeeping]', err.message));
  setInterval(run, 5 * 60 * 1000).unref();
  run();
};

const startServer = async () => {
  await connectDB();
  // Ensure provider IDs are unique before accepting Google registrations.
  await require('./src/models/User').init();
  await require('./src/models/AuthChallenge').init();
  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
  startHousekeeping();
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
