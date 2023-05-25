import { Input, Popover, Radio, Modal, message, Table, Popconfirm, Row, Col, Tooltip } from 'antd'
import { ArrowDownOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useSendTransaction, useWaitForTransaction } from "wagmi"
import BitcoinLogo from '../../images/bitcoin.png'
import { useAppContext } from '../../context'
import './index.css';
import { createPoolApi, deployTokenApi, BTCTestExplorerUrl } from '../../utils/apiRoutes'
import { defaultToken, factoryWalletAddress, formatOrderStatus, formatTime, isStringEqual } from '../../utils/constants'
import useGetPool from '../../hooks/useGetPool'



const columns = [
  {
    title: 'No',
    width: 50,
    render: (text, record, index) => index + 1,
  },
  {
    title: 'Pool',
    dataIndex: 'pool',
    key: 'pool',
    width: 130,
    render: (text, record, index) => record.token1.toUpperCase() + '/' + record.token2.toUpperCase()
  },
  {
    title: 'LP token',
    dataIndex: 'lp_token',
    key: 'lp_token',
    width: 90,
    render: (text, record, index) => text?.toUpperCase()
  },
  {
    title: 'Fee TX_ID',
    dataIndex: 'fee_txid',
    key: 'fee_txid',
    render: (text, record, index) => (
      <Tooltip
        title={text}
      >
        <a href={BTCTestExplorerUrl + text} target='_black'>
          {text?.slice(0, 10) + '...' + text?.slice(-10)}
        </a>
      </Tooltip >
    ),
  },
  {
    title: 'Fee Rate',
    dataIndex: 'fee_rate',
    key: 'fee_rate',
  },
  {
    title: 'Ordered Time',
    dataIndex: 'ordered_time',
    key: 'ordered_time',
    render: (text, record, index) => (text && formatTime(text))
  },
  {
    title: 'Status',
    dataIndex: 'order_status',
    key: 'order_status',
    render: formatOrderStatus
  },

];

const newTokencolumns = [
  {
    title: 'No',
    width: 50,
    render: (text, record, index) => index + 1,
  },
  {
    title: 'Token',
    dataIndex: 'token',
    key: 'token',
    render: (text) => text.toUpperCase()
  },
  {
    title: 'Fee TX_ID',
    dataIndex: 'fee_txid',
    key: 'fee_txid',
    render: (text, record, index) => (
      <Tooltip
        title={text}
      >
        <a href={BTCTestExplorerUrl + text} target='_black'>
          {text?.slice(0, 10) + '...' + text?.slice(-10)}
        </a>
      </Tooltip >
    ),
  },
  {
    title: 'Fee Rate',
    dataIndex: 'fee_rate',
    key: 'fee_rate',
  },
  {
    title: 'Ordered Time',
    dataIndex: 'ordered_time',
    key: 'ordered_time',
    render: (text, record, index) => (text && formatTime(text))
  },
  {
    title: 'Status',
    dataIndex: 'order_status',
    key: 'order_status',
    render: formatOrderStatus
  },

];



function CreateLq() {

  const inputRef = useRef();
  const [setTokenPair, currentPool, loading, error,] = useGetPool()
  const { setHeaderId, address, connected, tokenList, orderList, fetchOrderList } = useAppContext();
  const [keyword, setKeyword] = useState('');
  const [messageApi, contextHolder] = message.useMessage()
  const [tokenOne, setTokenOne] = useState(defaultToken)
  const [tokenTwo, setTokenTwo] = useState(defaultToken)
  const [lpToken, setlpToken] = useState(defaultToken);
  const [isOpen, setIsOpen] = useState(false)
  const [changeToken, setChangeToken] = useState(1)
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newTokenTick, setNewTokenTick] = useState('');
  const [newMaxSupply, setNewMaxSupply] = useState('');
  const [deployDescription, setDeployDescription] = useState('');
  const [tokenSelectList, setTokenSelectList] = useState([[], [], []])

  useEffect(() => {
    setHeaderId(0);
  }, [])

  useEffect(() => {
    let array = [];
    array.push(tokenList.filter((token) => !isStringEqual(token.tick, tokenTwo.tick) && !isStringEqual(token.tick, lpToken.tick)))
    array.push(tokenList.filter((token) => !isStringEqual(token.tick, tokenOne.tick) && !isStringEqual(token.tick, lpToken.tick)))
    array.push(tokenList.filter((token) => !isStringEqual(token.tick, tokenOne.tick) && !isStringEqual(token.tick, tokenTwo.tick)))
    setTokenSelectList([...array]);
  }, [tokenOne, tokenTwo, lpToken])

  useEffect(() => {
    setTokenOne(tokenList[0] || defaultToken)
    setTokenTwo(tokenList[1] || defaultToken)
    setlpToken(tokenList[2] || defaultToken)
  }, [tokenList])

  useEffect(() => {
    setTokenPair([tokenOne, tokenTwo])
  }, [tokenOne, tokenTwo])

  useEffect(() => {
    if (currentPool) {
      setlpToken(tokenList.find((token) => token.tick === currentPool.lp_token))
      console.log('currentPool.lp_token :>> ', currentPool.lp_token);
    }
  }, currentPool)

  useEffect(() => {
    if (address) {
      const interval = setInterval(() => {
        fetchOrderList();
      }, 5000);
      return () => {
        clearInterval(interval);
      }
    }
  }, [address])

  const switchTokens = () => {
    setTokenOne(tokenTwo)
    setTokenTwo(tokenOne)
  }

  const openModal = (token) => {
    // if (token === 1) setKeyword(tokenOne.tick.toUpperCase())
    // if (token === 2) setKeyword(tokenTwo.tick.toUpperCase())
    // if (token === 3) setKeyword(lpToken.tick.toUpperCase())
    setKeyword('')
    setChangeToken(token)
    setIsOpen(true)
    setTimeout(() => {
      inputRef.current.focus();
    }, 200);
  }

  const modifyToken = (i) => {
    if (changeToken === 1) {
      setTokenOne(tokenSelectList[0][i])
    } else if (changeToken === 2) {
      setTokenTwo(tokenSelectList[1][i])
    }
    else if (changeToken === 3) {
      setlpToken(tokenSelectList[2][i]);
    }
    setIsOpen(false)
  }

  const createPool = async () => {
    console.log(tokenOne, tokenTwo);
    try {
      messageApi.open({
        type: 'warning',
        content: `Ordering new liquidity pool for ${tokenOne.tick.toUpperCase()}/${tokenTwo.tick.toUpperCase()}`,
        duration: 20
      });
      const tx_id = await window.unisat.sendBitcoin(factoryWalletAddress, 5000);
      const body = {
        fee_txid: tx_id,
        fee_rate: 1,
        token1: tokenOne.tick,
        token2: tokenTwo.tick,
        lp_token: lpToken.tick,
        sender_address: address,
      }
      console.log('createPool', body);
      const { data } = await axios({
        method: 'post',
        url: createPoolApi,
        withCredentials: false,
        data: body,
      });
      if (data.status == 'success') {
        messageApi.destroy();
        messageApi.open({
          type: 'success',
          content: 'New pool was successfuly orderd!',
          duration: 3
        });
        await fetchOrderList();
      }
      else {
        messageApi.destroy();
        messageApi.open({
          type: 'error',
          content: 'Failed to create a new pool !',
          duration: 5
        })
      }
    } catch (error) {
      messageApi.destroy();
      messageApi.open({
        type: 'error',
        content: 'Failed to create a new pool !',
        duration: 5
      })
    }
  }

  const handleNewTokentickChange = (e) => {
    const value = e.target.value.toUpperCase();
    if (value.length <= 4) {
      setNewTokenTick(value)
    }
  }

  const handleNewMaxsupplyChange = (e) => {
    const isNumber = /^-?\d*\.?\d+$/;
    let value = e.target.value;
    if (value == '' || isNumber.test(value)) {
      if (value >= 21000000) value = '21000000';
      setNewMaxSupply(value);
    }
  }

  const handleDeployNewTokenBtn = () => {
    const index = tokenList.find((token) => token.tick.toUpperCase() == newTokenTick);
    let okString = `Are you sure to deploy ${newTokenTick} for totalsupply of ${newMaxSupply}?`;
    let duplicateString = `${newTokenTick} was already deployed.`;
    let tickErrorString = 'The length of Token tick should be 4.';
    let supplyErrorString = 'Please input max supply.';
    let tipString = '';
    if (newTokenTick.length != 4) {
      tipString = tickErrorString;
    }
    else if (index) {
      tipString = duplicateString;
    }
    else if (newMaxSupply == '' || newMaxSupply == 0) {
      tipString = supplyErrorString;
    }
    else {
      tipString = okString;
    }
    setDeployDescription(tipString);
    return (tipString == okString);
  }

  const deployNewToken = async () => {
    const status = handleDeployNewTokenBtn();
    if (status) {
      try {
        messageApi.open({
          type: 'warning',
          content: `Ordering new token ${newTokenTick} for totalsupply of ${newMaxSupply}`,
          duration: 20
        });
        const tx_id = await window.unisat.sendBitcoin(factoryWalletAddress, 5000);
        const body = {
          fee_txid: tx_id,
          fee_rate: 1,
          token: newTokenTick,
          max_supply: newMaxSupply,
          sender_address: address,
        }
        console.log('Deploying new token', body);
        const { data } = await axios({
          method: 'post',
          url: deployTokenApi,
          data: body,
        });
        console.log('Deploying new token', data);
        if (data.status === 'success') {
          messageApi.destroy();
          messageApi.open({
            type: 'success',
            content: 'New token deploy successfuly orderd!',
            duration: 3
          });
          setIsNewOpen(false);
          fetchOrderList();
        }
        else {
          messageApi.destroy();
          messageApi.open({
            type: 'error',
            content: 'New token deploy Failed!',
            duration: 3
          });
        }
      } catch (error) {
        console.log('New Token Deploy error', error);
        messageApi.destroy();
        messageApi.open({
          type: 'error',
          content: 'New token deploy Failed!',
          duration: 3
        });
      }
    }
  }

  const createLpOrderList = orderList.filter((order) => order.order_type === 1);
  const sortedOrderList = createLpOrderList.sort((a, b) => b.ordered_time - a.ordered_time);

  const newTokenOrderList = orderList.filter((order) => order.order_type === 5).sort((a, b) => b.ordered_time - a.ordered_time);

  const isCreateDisabled = !connected || currentPool || lpToken.tick == defaultToken.tick
  return (
    <Row justify="space-around" align="top" style={{ width: '100%' }}>
      {contextHolder}
      <Modal open={isOpen} footer={null} onCancel={() => { setIsOpen(false) }} title="Select a token">
        <Input
          onFocus={(event) => { event.target.select() }}
          ref={inputRef}
          placeholder=''
          value={keyword} onChange={(e) => { setKeyword(e.target.value) }}
        />
        <div className='modalContent'>
          {tokenSelectList[changeToken - 1].map((token, index) => {
            if (token.tick.toLowerCase().includes(keyword.toLowerCase()))
              return (
                <div className='tokenChoice' key={index}
                  onClick={() => modifyToken(index)}
                >
                  <img src={BitcoinLogo} alt={token.tick.toUpperCase()} className="tokenLogo" />
                  <div className='tokenChoiceNames w-100'>
                    <Row justify='start'>
                      <Col span={4} className='tokenName'>
                        {token.tick.toUpperCase()}
                      </Col>
                      <Col span={6} offset={7}>
                        MaxSupply:
                      </Col>
                      <Col span={5} >
                        <Row justify='end'>
                          {token.max}
                        </Row>
                      </Col>
                    </Row>
                    <Row className='tokenTicker'>
                      {token.tick.toUpperCase()}
                    </Row>
                  </div>
                </div>
              )
          })}
        </div>
      </Modal>
      <Modal open={isNewOpen} footer={null} onCancel={() => { setIsNewOpen(false) }}>
        <div className='tradeBox'>
          <div className='tradeBoxHeader'>
            <Row justify='center' className='w-100'>
              <h2>Deploy new Token</h2>
            </Row>
          </div>
          <div className='inputs mb-1'>
            <Input placeholder='Token Tick'
              value={newTokenTick}
              onChange={handleNewTokentickChange}
              onFocus={(event) => { event.target.select() }}
            />
          </div>
          <div className='inputs'>
            <Input placeholder='Max Supply'
              value={newMaxSupply}
              onChange={handleNewMaxsupplyChange}
              onFocus={(event) => { event.target.select() }}
            />
          </div>
          <Popconfirm
            title="Deploy new token?"
            description={deployDescription}
            onConfirm={deployNewToken}
            okText="OK"
            cancelText="Cancel"
            disabled={!connected}
          >
            <div className='swapButton mb-3' disabled={!connected} style={{ marginTop: '20px' }} onClick={handleDeployNewTokenBtn}>Deploy</div>
          </Popconfirm>
        </div>
      </Modal>
      <Col xl={8}>
        <Row justify='center' className='w-100'>
          <div className='tradeBox'>
            <Row justify='center' className='w-100'>
              <h2>Create a new liquidity pool</h2>
            </Row>
            <div className='inputs'>
              <div className='token-box'>
                <div className='asset-one-no-input' onClick={() => openModal(1)}>
                  <img src={BitcoinLogo} alt="assetOnelogo" className='logo' />
                  {tokenOne.tick.toUpperCase()}
                </div>
              </div>
              <div className='token-box'>
                <div className='asset-one-no-input' onClick={() => openModal(2)}>
                  <img src={BitcoinLogo} alt="assetTwologo" className='logo' />
                  {tokenTwo.tick.toUpperCase()}
                </div>
              </div>
              <div className="switchButton" onClick={switchTokens}>
                <ArrowDownOutlined className='switchArrow' />
              </div>
              <div>
                <div className='p-2'>
                  {!currentPool ? 'Select LP Token' : `${lpToken.tick.toUpperCase()}(${lpToken.max}) token already exists for this pool.`}
                </div>
                <div className='token-box'>
                  <div className='asset-one-no-input' onClick={() => !currentPool && openModal(3)}>
                    <img src={BitcoinLogo} alt="assetTwologo" className='logo' />
                    {lpToken.tick.toUpperCase()}
                  </div>
                  <Tooltip
                    title={connected ? 'Deploy new token' : 'Please connect wallet!'}
                  >
                    <div className='add-btn'
                      onClick={() => connected && setIsNewOpen(true)}
                    >
                      <div><PlusOutlined size='small' /></div>
                    </div>
                  </Tooltip>
                </div>
              </div>
              <Popconfirm
                title="Create pool?"
                description={`Are you sure to create pool for ${tokenOne.tick.toUpperCase()}/${tokenTwo.tick.toUpperCase()}?`}
                onConfirm={createPool}
                okText="Yes"
                cancelText="No"
                disabled={isCreateDisabled}
              >
                <Tooltip
                  title={!connected ? 'Please connect wallet' : currentPool ? `Pool already exists, LP token is ${lpToken.tick.toUpperCase()}` : 'Create new liquidity pool'}
                >
                  <div className='swapButton my-2' disabled={isCreateDisabled}>
                    Create new liquidity pool
                  </div>
                </Tooltip>
              </Popconfirm>
            </div>
          </div>
        </Row>
      </Col>
      <Col xl={16} >
        <Row justify='center'>
          <Col span={23}>
            <div className='table-title text-align-left p-2'>New pool Create Order List</div>
            <Table
              dataSource={sortedOrderList}
              columns={columns}
              pagination={{ pageSize: 5 }}
            />
            <div className='table-title text-align-left p-2'>New token Deploy Order List</div>
            <Table
              dataSource={newTokenOrderList}
              columns={newTokencolumns}
              pagination={{ pageSize: 5 }}
            />
          </Col>
        </Row>
      </Col>

    </Row>
  )
}

export default CreateLq