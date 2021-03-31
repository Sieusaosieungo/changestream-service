const MongoClient = require('mongodb').MongoClient;
const {
  MONGO_URI_MONITORED_DB,
  MONGO_DATABASE_MONITORED,
  MONGO_COLLECTIONS_MONITORED,
} = require('../configs');

const client = new MongoClient(MONGO_URI_MONITORED_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect().then(() => {
  MONGO_COLLECTIONS_MONITORED.forEach((collectionMonitored) => {
    const changeStream = client
      .db(MONGO_DATABASE_MONITORED)
      .collection(collectionMonitored)
      .watch();
    changeStream.on('change', (next) => {
      console.log(next);
    });
  });
});
