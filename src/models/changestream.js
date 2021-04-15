const axios = require('axios').default;
const MongoClient = require('mongodb').MongoClient;
const {
  MONGO_URI_MONITORED_DB,
  MONGO_DATABASE_MONITORED,
  MONGO_COLLECTIONS_MONITORED,
  GATEWAY_URL,
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
    changeStream.on('change', async (dataChange) => {
      console.log({ dataChange });
      const {
        operationType,
        clusterTime,
        ns,
        fullDocument,
        documentKey,
      } = dataChange;

      // call api logDb of Gateway to add log to Kafka
      const body = {
        operationType,
        timestamp: new Date(clusterTime.getHighBits() * 1000),
        name: ns.db,
        coll: ns.coll,
        documentKey: documentKey._id,
        currData: fullDocument,
      };
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      try {
        await axios.post(`${GATEWAY_URL}/api/v1/log-db`, body, config);
      } catch (error) {
        console.log({ error });
      }
    });
  });
});
