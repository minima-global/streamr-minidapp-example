import { useEffect, useRef, useState } from 'react'
import { EnvironmentId, StreamrClient } from '@streamr/sdk'

// The stream id that was generated in the first section
const STREAM_ID = '0x8f652892c780f063ee81288275c6fa860f024a9d/minima/peers/example'

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
