import { useEffect, useState } from "react";





export function useDebounce(value: string, delay: number) { // function : useDebounce

  
  const [debounced, setDebounced] = useState(value); // state : debounced




  useEffect(() => {   // useEffect : timeout
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);  // return for useEffect





  return debounced; // return for useDebounced function

}