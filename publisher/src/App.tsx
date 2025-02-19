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