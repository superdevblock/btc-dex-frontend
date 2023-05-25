import { useState, useEffect, useRef } from 'react'
import { Input, Popover, Radio, Modal, message, Popconfirm, Row, Col, Table, Button, Tooltip } from 'antd'
import { ArrowDownOutlined, SettingOutlined } from '@ant-design/icons'
import { useAppContext } from '../context'
import axios from 'axios'
import { useSendTransaction, useWaitForTransaction } from "wagmi"
import BitcoinLogo from '../images/bitcoin.png'
import { defaultToken, factoryWalletAddress, formatTime, formatOrderStatus, isStringEqual } from '../utils/constants'
import { addLiquidityApi, getBalanceApi, BTCTestExplorerUrl } from '../utils/apiRoutes'
import { orderStatusArray, ORDER_STATUS_LISTED, ORDER_STATUS_PROCESSING, ORDER_STATUS_FINALIZING, ORDER_STATUS_FAILED, ORDER_STATUS_CONFIRMED } from '../utils/constants'

const dataSource = [
  {
    pool: 'AMEX/BDEX',
    fee_txid: 'bcwei2234ihoihsdog',
    fee_rate: 1,
    token1_amount: 1000,
    token2_amount: 3000,
    token1_inscription_id: 'aisdfaeweefwwef',
    token2_inscription_id: 'aisdfaeweefwwef',
    status: 'success',
  },
]

const tokenSend = (text, record, index, id) => {
  const status = record.order_status;
  const transfer = id == 1 ? record.token_transfer1 : record.token_transfer2;
  const inscriptionId = transfer ? transfer.inscription : {};
  const disabled = (status == ORDER_STATUS_LISTED || localStorage.getItem(inscriptionId) == 'true')
  return (
    <>
      <Tooltip
        title={`${transfer ? 'inscription ID: ' + inscriptionId : 'Pending'}`}
      >
        <Button
          type={'primary'}
          disabled={disabled}
          onClick={async () => {
            try {
              await window.unisat.sendInscription(factoryWalletAddress, inscriptionId);
              localStorage.setItem(inscriptionId, 'true');

            } catch (error) {
            }
          }}
        >
          {localStorage.getItem(inscriptionId) == 'true' ? 'Sent' : 'Send'}
        </Button>
      </Tooltip>
    </>
  )
}

function AddLiquidity(props) {
  const inputRef = useRef();
  const { setHeaderId, address, tokenList, connected, getTokenBalance, orderList, fetchOrderList, getPoolBalance } = useAppContext();
  const [keyword, setKeyword] = useState('');

  const [messageApi, contextHolder] = message.useMessage()
  const [tokenOneAmount, setTokenOneAmount] = useState(0)
  const [tokenTwoAmount, setTokenTwoAmount] = useState(0)
  const [tokenOne, setTokenOne] = useState(defaultToken)
  const [tokenTwo, setTokenTwo] = useState(defaultToken)
  const [tokenOnePoolBalance, setTokenOnePoolBalance] = useState('0');
  const [tokenTwoPoolBalance, setTokenTwoPoolBalance] = useState('0');

  const [tooltipOneOpen, setTooltipOneOpen] = useState(false);
  const [tooltipTwoOpen, setTooltipTwoOpen] = useState(false);
  const [tokenOneBalance, setTokenOneBalance] = useState('0');
  const [tokenTwoBalance, setTokenTwoBalance] = useState('0');
  const [isOpen, setIsOpen] = useState(false)
  const [changeToken, setChangeToken] = useState(1)
  const [prices, setPrices] = useState({})

  const [tokenSelectList, setTokenSelectList] = useState([[], [], []])

  useEffect(() => {
    setHeaderId(1);
  }, [])

  useEffect(() => {
    let array = [];
    array.push(tokenList.filter((token) => !isStringEqual(token.tick, tokenTwo.tick)))
    array.push(tokenList.filter((token) => !isStringEqual(token.tick, tokenOne.tick)))
    setTokenSelectList([...array]);
  }, [tokenOne, tokenTwo])

  useEffect(() => {
    setTokenOne(tokenList[0] || defaultToken)
    setTokenTwo(tokenList[1] || defaultToken)
  }, [tokenList])

  const addLiquidityOrderList = orderList.filter((order) => order.order_type === 2)
  const sortedOrderList = addLiquidityOrderList.sort((a, b) => b.ordered_time - a.ordered_time)
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
      width: 90,
      render: (text, record, index) => record.token1?.toUpperCase() + '/' + record.token2?.toUpperCase()
    },
    {
      title: 'LP Token',
      dataIndex: 'lp_token',
      key: 'lp_token',
      width: 60,
      render: (text, record, index) => text?.toUpperCase()
    },
    {
      title: 'Fee TX_ID',
      dataIndex: 'fee_txid',
      key: 'fee_txid',
      width: 80,
      render: (text, record, index) => (
        <Tooltip
          title={text}
        >
          <a href={BTCTestExplorerUrl + text} target='_black'>
            {text?.slice(0, 10) + '...' + text?.slice(-10)}
          </a>
        </Tooltip>
      ),
    },
    {
      title: 'Fee Rate',
      dataIndex: 'fee_rate',
      key: 'fee_rate',
      width: 40
    },
    {
      title: 'Token1 Amount',
      dataIndex: 'status',
      key: 'amount1',
      dataIndex: 'amount1',
      width: 70,
    },

    {
      title: 'Token2 Amount',
      dataIndex: 'amount2',
      key: 'amount2',
      width: 70,
    },
    {
      title: 'Ordered Time',
      dataIndex: 'ordered_time',
      key: 'ordered_time',
      width: 70,
      render: (text, record, index) => (text && formatTime(text))
    },
    {
      title: 'Status',
      dataIndex: 'order_status',
      key: 'order_status',
      width: 70,
      render: formatOrderStatus
    },
    {
      title: 'Token1 Send',
      dataIndex: 'status',
      key: 'status',
      dataIndex: 'token1_amount',
      render: (text, record, index) => tokenSend(text, record, index, 1)
    },
    {
      title: 'Token2 Send',
      dataIndex: 'status',
      key: 'status',
      dataIndex: 'token1_amount',
      render: (text, record, index) => tokenSend(text, record, index, 2)
    },

  ];

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

  useEffect(() => {
    if (address) {
      (async () => {
        await getTokenBalance(tokenOne.tick, address, setTokenOneBalance);
        getTokenBalance(tokenTwo.tick, address, setTokenTwoBalance);
        getPoolBalance(tokenOne.tick, tokenTwo.tick, setTokenOnePoolBalance, setTokenTwoPoolBalance);
        console.log('TOKENONECHANGED', tokenOne);
      })()
    }
  }, [tokenOne, tokenTwo, address])

  // useEffect(() => {
  //   if (address) {
  //     getTokenBalance(tokenTwo.tick, address, setTokenTwoBalance)
  //     getPoolBalance(tokenOne.tick, tokenTwo.tick, setTokenOnePoolBalance, setTokenTwoPoolBalance)
  //   }
  // }, [tokenTwo, address])

  const switchTokens = () => {
    setPrices(null)
    setTokenOneAmount(0)
    setTokenTwoAmount(0)
    setTokenOne(tokenTwo)
    setTokenTwo(tokenOne)
  }

  const openModal = (token) => {
    setKeyword('');
    setChangeToken(token)
    setIsOpen(true)
    setTimeout(() => {
      inputRef.current.focus();
    }, 200);
  }

  const modifyToken = (i) => {
    if (changeToken === 1) {
      setTokenOne(tokenList[i]);
    } else {
      setTokenTwo(tokenList[i]);
    }
    setIsOpen(false);
  }

  const handleAddLiquidity = async () => {
    console.log(tokenOne, tokenTwo);
    try {
      messageApi.open({
        type: 'warning',
        content: `Creating new liquidity pool for ${tokenOne.tick.toUpperCase()}/${tokenTwo.tick.toUpperCase()}`,
        duration: 20
      });
      const tx_id = await window.unisat.sendBitcoin(factoryWalletAddress, 1000);
      const body = {
        fee_txid: tx_id,
        fee_rate: 1,
        token1: tokenOne.tick,
        token2: tokenTwo.tick,
        amount1: tokenOneAmount,
        amount2: tokenTwoAmount,
        sender_address: address,
      }
      const { data } = await axios.post(addLiquidityApi, body);
      console.log('create new pool', data);
      if (data.status == 'success') {
        messageApi.destroy();
        messageApi.open({
          type: 'success',
          content: 'New pool successfuly was created!',
          duration: 3
        });
      }
      else {
        messageApi.destroy();
        messageApi.open({
          type: 'error',
          content: 'Creating new pool Failed!',
          duration: 5
        })
      }
    } catch (error) {
      messageApi.destroy();
      messageApi.open({
        type: 'error',
        content: 'Creating new pool Failed!',
        duration: 5
      })
    }
    await fetchOrderList();
  }

  const handleTokenAmountChange = (e, id) => {
    let value = Number(e.target.value);
    if (value <= 0) value = 0;
    if (value > 99999999) return;
    if (id == 1) {
      // if (value > tokenOneBalance) setTooltipOneOpen(true);
      // else {
      setTooltipOneOpen(false);
      setTokenOneAmount(value);
      // setTokenTwoAmount((e.target.value * 2).toFixed(2))
      // }
    }
    if (id == 2) {
      // if (value > tokenTwoBalance) setTooltipTwoOpen(true);
      // else {
      setTooltipTwoOpen(false);
      setTokenTwoAmount(value)
      // }
    }

    setTimeout(() => {
      setTooltipOneOpen(false);
      setTooltipTwoOpen(false);
    }, 4000);
  }

  const isAddDisabled = !connected || tokenOne.tick == defaultToken.tick || tokenTwo.tick == defaultToken.tick || tokenOneAmount == 0 || tokenTwoAmount == 0
  return (<>
    {contextHolder}
    <Modal open={isOpen} footer={null} onCancel={() => { setIsOpen(false) }} title="Select a token">
      <Input
        ref={inputRef}
        placeholder='' value={keyword} onChange={(e) => { setKeyword(e.target.value.toUpperCase()) }}
        onFocus={(event) => { event.target.select() }}
      />
      <div className='modalContent'>
        {tokenSelectList[changeToken - 1].map((token, index) => {
          if (token.tick.toLowerCase().includes(keyword.toLowerCase()))
            return (
              <div className='tokenChoice' key={index}
                onClick={() => modifyToken(index)}
              >
                <img src={BitcoinLogo} alt={token.tick.toUpperCase()} className="tokenLogo" />
                <div className='tokenChoiceNames'>
                  <div className='tokenName'>
                    {token.tick.toUpperCase()}
                  </div>
                  <div className='tokenTicker'>
                    {token.tick.toUpperCase()}
                  </div>
                </div>
              </div>
            )
        })}
      </div>
    </Modal>
    <Row className='w-100' justify='space-around' align='top' >
      <Col xl={8}>
        <Row justify='center' className='w-100 p-2' >
          <div className='tradeBox'>
            <Row justify='center' align='middle' className='w-100'>
              <h2>Add liquidity</h2>
            </Row>
            <div className='inputs'>
              <Row align='middle'>
                <Col span={24}>
                  <Row align='middle' className='pb-2'>
                    <Col span={6}>
                      <Row justify='end' className='f-size-15' >My Balance:</Row>
                      <Row justify='end' className='f-size-15'>Pool Balance:</Row>
                    </Col>
                    <Col span={4}>
                      <Row justify='end' className='f-size-20'>{tokenOne.tick.toUpperCase()}:</Row >
                      <Row justify='end' className='f-size-20'>{tokenOne.tick.toUpperCase()}:</Row >
                    </Col >
                    <Col span={4}>
                      <Row justify='end' className='f-size-20 bold '> {tokenOneBalance}</Row >
                      <Row justify='end' className='f-size-20 bold'>{tokenOnePoolBalance}</Row >
                    </Col>
                    <Col span={4}>
                      <Row justify='end' className='f-size-20'>{tokenTwo.tick.toUpperCase()}:</Row >
                      <Row justify='end' className='f-size-20'>{tokenTwo.tick.toUpperCase()}:</Row >
                    </Col >
                    <Col span={4}>
                      <Row justify='end' className='f-size-20 bold '> {tokenTwoBalance}</Row >
                      <Row justify='end' className='f-size-20 bold '>{tokenTwoPoolBalance}</Row >
                    </Col>
                  </Row>
                  <Row>
                    <div className='inputs'>
                      <Tooltip
                        title="Insufficent balance"
                        open={tooltipOneOpen}
                        placement="topLeft"
                      >
                        <Input
                          placeholder='0'
                          type='number'
                          value={tokenOneAmount}
                          onChange={(e) => handleTokenAmountChange(e, 1)}
                          onFocus={(event) => { event.target.select() }}
                        />
                      </Tooltip>
                      <Tooltip
                        title="Insufficent balance"
                        open={tooltipTwoOpen}
                        placement="topLeft"
                      >
                        <Input
                          placeholder='0'
                          type='number'
                          value={tokenTwoAmount}
                          onChange={(e) => handleTokenAmountChange(e, 2)}
                          onFocus={(event) => { event.target.select() }}
                        />
                      </Tooltip>
                      <div className="switchButton" onClick={switchTokens}>
                        <ArrowDownOutlined className='switchArrow' />
                      </div>
                      <div className='assetOne' onClick={() => openModal(1)}>
                        <img src={BitcoinLogo} alt="assetOnelogo" className='logo' />
                        {tokenOne.tick.toUpperCase()}
                      </div>
                      <div className='assetTwo' onClick={() => openModal(2)}>
                        <img src={BitcoinLogo} alt="assetTwologo" className='logo' />
                        {tokenTwo.tick.toUpperCase()}
                      </div>
                    </div>
                  </Row>
                  <Popconfirm
                    title="Create pool?"
                    description={`Are you sure to add liquidity for ${tokenOne.tick.toUpperCase()}/${tokenTwo.tick.toUpperCase()}?`}
                    onConfirm={handleAddLiquidity}
                    // onCancel={createPool}
                    okText="Yes"
                    cancelText="No"
                    disabled={isAddDisabled}
                  >
                    <div className='swapButton my-2' disabled={isAddDisabled}>
                      Add liquidity
                    </div>
                  </Popconfirm>
                </Col>
              </Row>
            </div>
          </div>
        </Row>
      </Col>
      <Col xl={16} >
        <Row justify='center' className='w-100'>
          <Col span={23}>
            <Row>
              <div className='table-title text-align-left p-2'>Order List</div>
            </Row>
            <Row >
              <Table
                dataSource={sortedOrderList}
                columns={columns}
                pagination={{ pageSize: 5 }}
                className='w-100'
              />
            </Row>
          </Col>
        </Row>
      </Col>
    </Row>
  </>
  )
}

export default AddLiquidity;