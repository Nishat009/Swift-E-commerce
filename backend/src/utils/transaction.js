// Runs a group of writes as one MongoDB transaction when the server supports it.
// Atlas and any replica set or sharded cluster do; a plain local `mongod` (the default dev setup)
// does not, and there the writes run one after another without a session. Every write inside
// `work` must pass the given options (`{ session }`, or `{}` on a standalone server).
const mongoose = require('mongoose');

let supported = null;

const transactionsSupported = async () => {
  if (supported === null) {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    supported = Boolean(hello.setName) || hello.msg === 'isdbgrid';
  }
  return supported;
};

const withTransaction = async (work) => {
  if (!(await transactionsSupported())) return work({});
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work({ session });
    });
    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = { withTransaction, transactionsSupported };
