import React, { useRef, useEffect, useState } from 'react'
import axios from 'axios';

import { } from '../utils/apiRoutes';


export default function useGetPool() {
  const [tokenPair, setTokenPair] = useState([])
  const [currentPool, setCurrentPool] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tokenPair.length < 2) return;
    let componentMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get(poolListApi + tokenPair[0].tick + '/' + tokenPair[1].tick)
        console.log('tokenPair :>> ', poolListApi + tokenPair[0].tick + '/' + tokenPair[1].tick);
        if (componentMounted && data.status == 'success') {
          setCurrentPool(data.data)
          return;
        }
        setCurrentPool(null);
      } catch (err) {
        setLoading(false)
        setError(err)
        setCurrentPool(null);
      }
      finally {
        setLoading(false)
      }
    }
    fetchData()
    return () => {
      componentMounted = false;
    }
  }, [tokenPair])

  return [setTokenPair, currentPool, loading, error,]
}