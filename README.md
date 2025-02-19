# Streamr Minidapp Tutorial Files

In this tutorial we will be building a **Streamr Publisher** **MiniDapp** that will publish the peerlist from the minima node to the **Streamr** service and create a **Subscriber MiniDapp** that will subscribe to the stream to retrieve the peerlist. The publisher app will run as a background service on your own Minima node whilst the subscriber app can be distributed to anyone. Before you follow this tutorial, we heavily advise that you check out **Streamr** over at https://streamr.network/ to learn more about their network.

Before we can begin, you will need the following things set up:

- NPM v8 or greater
- NodeJS 18.13.x or greater (version 20 and later ideally)
- A small amount of `MATIC` to pay for gas on Polygon mainnet
- A running Minima node

### Setting up a Streamr node

---

Setting up a **Streamr** node will allow our  `service.js` file in our **Publisher MiniDapp** to communicate with **Streamr** via HTTP to publish messages to our stream. The following section will setup a **Streamr** node using Node.js, but you can also set up a **Streamr** node with **Docker** as per the instructions from the page: https://docs.streamr.network/guides/how-to-run-streamr-node#the-streamr-node-docker-guide

Let’s start by running the installation command via `NPM`

```jsx
npm install -g @streamr/node

```

Once it’s installed, run the following command to create a config json file

```jsx
streamr-node-init

```

Follow the command prompts. Please ensure you pick the right network if you’re using `Polygon` or `Polygon Amoy` . In our examples, we will be using `Polygon`. Once you have reached the end, you should see a message that will display some information which include: `Congratulations, you've setup your Streamr node!` . If you do not see this visit the 

**Streamr** node setup docs page here: https://docs.streamr.network/guides/how-to-run-streamr-node#the-streamr-node-npm-guide

You can access the configuration file at anytime under the following path:

```jsx
~/.streamr/config/default.json

```

We’re going to make a few edits before we run our node. We’ve removed API keys for now to make things easier to follow, please edit your config file so it should look like below:

```jsx
{
  "$schema": "<https://schema.streamr.network/config-v3.schema.json>",
  "client": {
    "auth": {
      "privateKey": "YOUR PRIVATE KEY"
    },
    "environment": "polygon"
  },
  "plugins": {
    "http": {}
  }
}

```

Once you have confirmed the json file, you can run your **Streamr** node by running the following command in the command line:

```jsx
streamr-node ~/.streamr/config/default.json

```

You should see some logs print up which include the below, refer to **Streamr** docs if you see something else:

```jsx
INFO [2024-09-13T13:52:03.391] (broker                   ): Start Streamr node version 101.1.2
INFO [2024-09-13T13:52:03.394] (httpServer               ): Started HTTP server on port 7171

```

### Creating a Streamr stream

---

In order for us to publish data to a stream, we must first create a **Streamr** stream, to do this we’re going to write a simple script.

First, we need to create a directory and cd into the directory by running the following command in the command line:

```jsx
mkdir streamr-setup && cd streamr-setup

```

Now lets initialise the **Node.js** project with `-y` to skip the input

```jsx
npm init -y

```

Install the `streamr-sdk` as a dependency by running the following command in the command line:

```jsx
npm i @streamr/sdk

```

Lets create a JavaScript file that will create the stream and return the id. Please note that the private key must be specified and the correct network. Please run this in the command line:

```jsx
touch index.js && nano index.js

```

Explanation: The script below is going to do the following things

- Create the **Streamr** client
- Create the **Streamr** stream
- Grant public permissions to the **Streamr** stream so that anyone can subscribe to the stream.

Copy & paste the script below into the command line or open the script in a code editor and edit the following variables:

`STREAM_ID` - the id that you want to give to your stream

`PRIVATE_KEY` - your wallet private key

`ENVIRONMENT` - “polygon” or “polygon-amoy”

```jsx
const Streamr = require("@streamr/sdk");
const { StreamPermission } = require("@streamr/sdk");

const STREAM_ID = "/minima/peers/example";
const PRIVATE_KEY = "";
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

```

Now that the script is complete you can run the script using the following command in the command line:

```jsx
node index.js

```

You will see an output like the following, take note of the id as this will be used later. The **Streamr** node setup is now complete and we can move on with the Minima’s side of development.

```jsx
Your stream id is: 0x8f652892c780f063ee81288275c6fa860f024a9d/minima/peers/example

```

### Creating a Streamr Publisher service.js Minidapp

---

Creating a service.js MiniDapp is super simple. First we just need to create a `service.js` file in the root folder of the MiniDapp to load as a background service for the MiniDapp when it is installed.

This tutorial will skip over the creation of the **MiniDapp** base.

Before you continue, please check out the [build.minima.global](http://build.minima.global/) website for existing tutorials, or view the code mentioned in this tutorial on **Github** at the end of the tutorial.

Now that you know how to set up a Minidapp, you can now `cd` into our **Publisher** **MiniDapp** directory and create & edit the `service.js` file with the following command in the command line:

```
cd ./streamr-publisher-minidapp && touch service.js && nano service.js

```

You will need to edit the `STREAM_ID` variable to the stream id that was generated earlier in the tutorial. You can leave the other variables if you have not changed the default port number that the **Streamr** node runs on. If you have allocated a custom port, edit the `STREAMR_NODE_HOST` variable.

Look at the code comments in the code snippet below to understand what is happening in the `service.js` script.

Also note:

- The `Stream ID` must be encoded or else the URL will be treat slashes in our stream id as paths
- We create a logs table so that we can show the results on the `service.js` client **MiniDapp**
- [`MDS.net.POST`](http://mds.net.post/) currently only supports JSON objects as the body, so you must ensure that the data is a valid JSON object.

```jsx
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

```

> Note: Although service.js is just a javascript file, there are a few restrictions. Promises are currently not supported and there are a few reserved keywords that should be avoided such as class. Our script does not break these rules, but this tip may be helpful when customising the script or writing your own service.js files in the future.
> 

Next, let's create edit the client on our **Publisher MiniDapp** so that we can see when messages are published. Our `service.js` file writes to a logs sql table so that our client side can just query this data and display it. Open the `App.tsx` in the command line or your favourite code editor and add the following code. Look at the comments to see what we're doing.

> You will need to run npm install date-fns as we're using date-fns to format the new to a human readable datetime string.
> 

```jsx
import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'

function App() {
  const loaded = useRef(false)
  const [logs, setLogs] = useState<{ MESSAGE: string; STATUS: string; DATETIME: string }[] | null>(null);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true

      MDS.init((msg) => {

        // When MDS is initialised or every 10 seconds, load the logs we have stored in sql
        if (msg.event === 'inited' || msg.event === 'MDS_TIMER_10SECONDS') {
          MDS.sql("SELECT * FROM `logs`", (response) => {

            // Set the logs into state so that we can render the results
            setLogs(response.rows.reverse());
          })
        }
      })
    }
  }, [loaded]);

  return (
    <div className="h-screen w-screen p-4">
      <div>
        <h1 className="text-2xl mb-4">Publisher - Logs</h1>
        <div>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Message
                </th>
                <th scope="col" className="px-6 py-3">
                  Datetime
                </th>
              </tr>
              </thead>
              <tbody>
              {logs && logs.map((log) => (
                <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <th className="px-6 py-4">
                    {log.STATUS === "1" ?
                      <svg xmlns="<http://www.w3.org/2000/svg>" width="24" height="24" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                           className="w-5 h-5 stroke-emerald-500">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg> :
                      <svg xmlns="<http://www.w3.org/2000/svg>" width="24" height="24" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                           className="w-5 h-5 stroke-red-500">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>}
                  </th>
                  <th scope="row" className="whitespace-break-spaces break-all px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {log.MESSAGE}
                  </th>
                  <td className="px-6 py-4">
                    {format(new Date(Number(log.DATETIME)), "do 'of' MMMM, yyyy '@' h:mm:ss a")}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
```

> React hooks are also available for Streamr, documentation can be found here: https://docs.streamr.network/guides/web-app-frameworks/#use-our-react-hooks. We have chosen to use the standard SDK so that the code is adaptable to any JavaScript frontend framework/library.
> 

Now that the **Streamr Publisher Minidapp** is completed, let's build and zip the project into a file so that we can install it via the **MiniHub** or the Minima command line. Once the MiniDapp is installed, uou should see the following messages in your Minima **Terminal**.

```jsx
Minima @ 13/09/2024 14:45:32 [294.5 MB] : MDS_Streamr-server_0xC03A90BC9E32FD92E07525E0BE28D35E3B7BCBCD7D86AA1344E8B0F22E35465D > Streamr Publisher Example - Started!
Minima @ 13/09/2024 14:45:32 [294.5 MB] : MDS_Streamr-server_0xC03A90BC9E32FD92E07525E0BE28D35E3B7BCBCD7D86AA1344E8B0F22E35465D > Streamr message was published successfully!

```

Open up the *Streamr Publisher MiniDapp* in `Minihub` and you will now see a table with all of the logs for each published message. If the status icon is green tick it means the messages were published successfully, otherwise the icon will be a red cross which means the message publishing failed. 

![Screenshot_2024-09-13_at_16 06 30](https://github.com/user-attachments/assets/6cfb6c46-0a44-4d84-b1aa-de4e02c3d020)

If you see errors, feel free to post a message in our **dev channe**l on **Discord** but when sharing any code ⚠️ **DO NOT expose your private key to anyone including members of the Minima or Streamr team**.

You can also see the live data feed for your *Streamr* stream by searching your stream id here and clicking the live data button on the top right: https://streamr.network/hub/streams?tab=all

Now that's the **Streamr Publisher MiniDapp** completed! Next, will be creating the **Streamr Subscriber MiniDapp** that will subscribe to our published messages.

### Creating a Streamr Subscriber **MiniDapp**

---

For this section, we have assumed that you already know to build a **MiniDapp**. Create a new Minidapp for our Subscriber MiniDapp. 

First, let's `cd` into the **MiniDapp** directory and install `@streamr/sdk` via the command line.

```jsx
cd ./streamr-subscriber-minidapp && npm i @streamr/sdk

```

Open up the `App.tsx` and add the following code. Since our **Streamr** stream is public accessibly by anyone, we do not need to specify an private key.

- Edit the `STREAM_ID` variable to the stream id that you generated earlier.
- If you have using `Polygon Amoy` please change the `ENVIRONMENT` variable to `polygon amoy`

```jsx
import { useEffect, useRef, useState } from 'react'
import { EnvironmentId, StreamrClient } from '@streamr/sdk'

// The stream id that was generated in the first section
const STREAM_ID = '0x8f652892c780f063ee81288275c6fa860f024a9d/minima/peers/dev'

var ENVIRONMENT: EnvironmentId = "polygon";

const streamrClient = new StreamrClient({
  environment: ENVIRONMENT
})

function App() {
  const loaded = useRef(false)
  const [content, setContent] = useState<string[]>([]);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true

      MDS.init((msg) => {
        if (msg.event === 'inited') {
          streamrClient.subscribe(STREAM_ID, (content) => {

            console.log(content);

            // store the content into the array while keeping the previous content stored
            setContent(prevState => [...prevState, content as string]);
          })
        }
      })
    }
  }, [loaded])

  return (
    <div className="h-screen w-screen p-4">
      <div>
        <h1 className="text-2xl mb-4">Subscriber - Logs</h1>
        <div>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Message
                </th>
              </tr>
              </thead>
              <tbody>
              {content.length === 0 && (
                <tr className="bg-white dark:bg-gray-800">
                  <td colSpan={2} className="px-6 py-4">
                    Waiting for content...
                  </td>
                </tr>
              )}
              {content.map((log) => (
                <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <th scope="row"
                      className="whitespace-break-spaces break-all px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {JSON.stringify(log)}
                  </th>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

```

And that's the **Subscriber MiniDapp** done.

Build and zip the Minidapp and install it via the **Minihub** or command line. Once it’s installed, open the **Subscriber MiniDapp** and you will see something like this if your **Streamr Publisher MiniDapp** is running from the previous section.

![Screenshot_2024-09-13_at_16 06 48](https://github.com/user-attachments/assets/51f56422-dc59-4dba-9892-e1c4141dddd1)

And that’s it! You have successfully created a **Publisher MiniDapp** that can publish messages to **Streamr**, and a **Subscriber MiniDapp** that can subscribe to streams on **Streamr** network.

We heavily recommend checking out the rest of the **Build Minima Website** - [build.minima.global](http://build.minima.global/) for more tutorials and the **Streamr** [docs](https://docs.streamr.network/) to learn more about *Streamr*.
