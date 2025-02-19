const Streamr = require("@streamr/sdk");
const { StreamPermission } = require("@streamr/sdk");

const STREAM_ID = "/minima/peers/example";
const PRIVATE_KEY = "PRIVATE_KEY"; // REPLACE WITH YOUR PRIVATE KEY
const ENVIRONMENT = "polygon";

const streamr = new Streamr({
  auth: {
    privateKey: PRIVATE_KEY,
  },
  environment: ENVIRONMENT
});

(async () => {
  const stream = await streamr.getOrCreateStream({
    id: STREAM_ID,
  });

  await stream.grantPermissions({
    public: true,
    permissions: [StreamPermission.SUBSCRIBE],
  });

  console.log("Keep note of this stream id, you will need it to publish and subscribe to the stream");
  console.log(stream.id);
  process.exit();
})();