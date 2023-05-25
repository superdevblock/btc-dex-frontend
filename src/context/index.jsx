import { useState, useEffect, useContext, createContext, useRef } from "react";
import { Input, Popover, Radio, Modal, message } from 'antd';
import defaultTokenList from '../defaultTokenList.json'
import axios from 'axios';
import { tokenListApi, poolListApi, tokenInfoApi, getOrderListApi, getBalanceApi } from "../utils/apiRoutes";

const defaultPoolList = [{
  "_id": "6469d03371e7997f584de7fa",
  "VERSION": 1,
  "token1": "AMAX",
  "token2": "CNYG",
  "address": "tb1pc57x3rtg7lczxxlh4ccxpdt6ddnwekzmrrkj5f8kp7n2fkekk4uqxugua8"
},
{
  "_id": "6469da4440ca4b5c7feb80a8",
  "VERSION": 1,
  "token1": "AMAX",
  "token2": "CNYG",
  "address": "tb1ph9dc6haz2w44dz9qh8za8uz5v250v4s2lqlyrkcc44s8mtaqgw8qm4wzz6"
}]

const AppContext = createContext({});

export function AppContextProvider({ children }) {

  const [headerId, setHeaderId] = useState(null);
  const [messageApi, contextHolder] = message.useMessage()
  const [unisatInstalled, setUnisatInstalled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [publicKey, setPublicKey] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState({
    confirmed: 0,
    unconfirmed: 0,
    total: 0,
  });
  const [network, setNetwork] = useState("livenet");

  const [tokenList, setTokenList] = useState(defaultTokenList);
  const [poolList, setPoolList] = useState([]);
  const [orderList, setOrderList] = useState([]);

  useEffect(() => {
    const loadLists = async () => {
      const tokenListRes = await fetchTokenList();
      const poolListRes = await fetchAllPoolInfo();
      const orderListRes = await fetchOrderList();
      console.log(tokenList);
      if (tokenListRes.length !== 0) {
        messageApi.open({
          content: 'Token list is loaded!',
          type: 'success',
          duration: 3
        })
        setTokenList(tokenListRes);
      }
      if (poolListRes.length !== 0) {
        messageApi.open({
          content: 'Pool list is loaded!',
          type: 'success',
          duration: 3
        })
        console.log('poolList :>> ', poolListRes);
        setPoolList(poolListRes);
      }
      if (orderListRes.length !== 0) {
        messageApi.open({
          content: 'Order list is loaded!',
          type: 'success',
          duration: 3
        })
        setOrderList(orderListRes);
      }
    }
    loadLists();
  }, [connected])

  const fetchOrderList = async () => {
    if (!address) return []
    try {
      const res = await axios.get(getOrderListApi + address);
      console.log("getOrderListApi", res);
      setOrderList(res.data.data)
      return res.data.data;
    } catch (error) {
      console.log("getOrderListApi", error);
      return [];
    }
  }

  const fetchTokenList = async () => {
    try {
      const res = await axios.get(tokenListApi);
      console.log("fetchTokenList", res);
      return res.data.data;
    } catch (error) {
      console.log("fetchTokenList", error);
      return [];
    }
  }

  const fetchAllPoolInfo = async () => {
    try {
      const res = await axios.get(poolListApi);
      console.log("fetchAllPoolInfo", res);
      return res.data.data;
    } catch (error) {
      console.log("fetchAllPoolInfo", error);
      return [];
    }
  }

  const getBasicInfo = async () => {
    const unisat = (window).unisat;
    const [address] = await unisat.getAccounts();
    console.log('address=========>', address);
    setAddress(address);

    const publicKey = await unisat.getPublicKey();
    setPublicKey(publicKey);

    const balance = await unisat.getBalance();
    setBalance(balance);

    const network = await unisat.getNetwork();
    setNetwork(network);
  };

  const selfRef = useRef({
    accounts: [],
  });

  const self = selfRef.current;
  const handleAccountsChanged = (_accounts) => {
    if (self.accounts[0] === _accounts[0]) {
      // prevent from triggering twice
      return;
    }
    self.accounts = _accounts;
    if (_accounts.length > 0) {
      setAccounts(_accounts);
      setConnected(true);

      setAddress(_accounts[0]);

      getBasicInfo();
    } else {
      setConnected(false);
    }
  };

  const handleNetworkChanged = (network) => {
    setNetwork(network);
    getBasicInfo();
  };

  useEffect(() => {
    const unisat = window.unisat;
    if (unisat) {
      setUnisatInstalled(true);
    } else {
      return;
    }
    unisat.getAccounts().then((accounts) => {
      handleAccountsChanged(accounts);
    });

    unisat.on("accountsChanged", handleAccountsChanged);
    unisat.on("networkChanged", handleNetworkChanged);
    getBasicInfo();

    return () => {
      unisat.removeListener("accountsChanged", handleAccountsChanged);
      unisat.removeListener("networkChanged", handleNetworkChanged);
    };
  }, []);

  const connectWallet = async () => {
    const unisat = window.unisat;
    console.log('connect button', unisat);
    if (!unisat) {
      messageApi.destroy()
      messageApi.open({
        content: 'Please install Unisat wallet!',
        type: 'warning',
        duration: 3
      })
      return;
    }
    try {
      const result = await unisat.requestAccounts();
      await unisat.switchNetwork('testnet')
      handleAccountsChanged(result);
      messageApi.destroy()
      messageApi.open({
        content: 'Successfully connected!',
        type: 'success',
        duration: 3
      })
      setConnected(true);
    } catch (error) {
      messageApi.destroy()
      messageApi.open({
        content: 'User disconnected wallet!',
        type: 'error',
        duration: 3
      })
    }
  }

  const getTokenBalance = async (tokenTick, address, setter) => {
    try {
      setter((state) => '...');
      const { data } = await axios.get(getBalanceApi + tokenTick + '/' + address);
      if (data.status) {
        setter(data.data);
        return data.data;
      }
      setter('0');
      return 'error'
    } catch (error) {
      setter('0');
      return 'error'
    }
  }

  const getPoolBalance = async (tokenOneTick, tokenTwoTick, setterOne, setterTwo) => {
    try {
      console.log('getPoolBalance :>> ', tokenOneTick, tokenTwoTick);
      setterOne((state) => '...'); setterTwo((state) => '...');
      const { data } = await axios.get(poolListApi + tokenOneTick + '/' + tokenTwoTick);
      if (data.status) {
        setterOne(data.data.balance1);
        setterTwo(data.data.balance2);
        return data.data;
      }
      setterOne('0');
      setterTwo('0');
      return 'error'
    } catch (error) {
      setterOne('0');
      setterTwo('0');
      return 'error'
    }
  }


  return (
    <AppContext.Provider
      value={{
        headerId, setHeaderId,
        connected,
        address,
        connectWallet,
        tokenList, poolList,
        orderList, setOrderList, fetchOrderList,
        getTokenBalance, getPoolBalance
      }}
    >
      {children}
      {contextHolder}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  return useContext(AppContext);
}