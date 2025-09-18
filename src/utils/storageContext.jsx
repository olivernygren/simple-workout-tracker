import React, { createContext, useContext, useMemo, useState } from "react";
import { createActions, load } from "./storage";

const Ctx = createContext(null);
export function StorageProvider({ children }) {
  const [data, setData] = useState(() => load());
  const actions = useMemo(() => createActions(data, setData), [data, setData]);
  const value = useMemo(() => ({ data, ...actions }), [data, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useStorage() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStorage outside provider");
  return ctx;
}
