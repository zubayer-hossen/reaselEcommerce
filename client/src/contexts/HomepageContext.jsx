import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';
const Ctx=createContext({sections:[],loading:true});
export function HomepageProvider({children}){const [sections,setSections]=useState([]),[loading,setLoading]=useState(true);useEffect(()=>{api.get('/homepage/public').then(r=>setSections(r.data?.sections||[])).catch(()=>{}).finally(()=>setLoading(false));},[]);return <Ctx.Provider value={{sections,loading}}>{children}</Ctx.Provider>}
export const useHomepage=()=>useContext(Ctx);
