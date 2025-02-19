var STREAM_ID = "0x8f652892c780f063ee81288275c6fa860f024a9d/minima/peers/dev";
var ENCODED_STREAM_ID = encodeURIComponent(STREAM_ID);
var STREAMR_NODE_HOST = "http://localhost:7171";

var getPeers = function(callback) {
  MDS.cmd("peers max:10", callback);
}

MDS.init(function(msg) {

  // One time event that is triggered when MDS is initialised
  if (msg.event === 'inited') {

		MDS.log("Streamr Publisher Example - Started!");

    // create logs table
    MDS.sql("CREATE TABLE IF NOT EXISTS `logs` (`message` varchar(1024) NOT NULL, `status` smallint NOT NULL, `datetime` bigint NOT NULL)");
  }

  // get the peers when app initialised and every 10 seconds
  if (msg.event === 'inited' || msg.event === 'MDS_TIMER_10SECONDS') {

    getPeers(function (msg) {

      // data must be a valid JSON object
      var data = {
        peersList: msg.response.peerslist,
      };

      // we need to stringify the json for the stream + logging
      var dataAsString = JSON.stringify(data);

      // Post request to the streamr node
      MDS.net.POST(STREAMR_NODE_HOST + "/streams/" + ENCODED_STREAM_ID, dataAsString, function(response) {

        // Log messages if the request was successful and unsuccessful
        if (response.status) {
          MDS.log("Streamr message was published successfully!");
          MDS.sql("INSERT INTO `logs` VALUES ('" + dataAsString + "', 1, " + new Date().getTime() + ")");
        } else {
          MDS.log("Streamr message could not sent published!");
          MDS.sql("INSERT INTO `logs` VALUES ('" + dataAsString + "', 0, " + new Date().getTime() + ")");
        }
      });
    })
  }
})