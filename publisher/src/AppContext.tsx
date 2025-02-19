import { createContext, useRef, useEffect } from "react";

export const appContext = createContext({} as any);

interface IProps {
  children: any;
}
const AppProvider = ({ children }: IProps) => {
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      (window as any).MDS.init((msg: any) => {
        if (msg.event === "inited") {
          // do something Minim-y
        }
      });
    }
  }, [loaded]);

  return (
    <appContext.Provider
      value={
        {
          // add some stuff
        }
      }
    >
      {children}
    </appContext.Provider>
  );
};

export default AppProvider;
