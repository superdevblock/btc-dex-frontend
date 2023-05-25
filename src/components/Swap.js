import { Input, Popover, Radio, Modal, message, Popconfirm, Row, Col, Table, Button, Tooltip } from 'antd'
import { ArrowDownOutlined, SettingOutlined } from '@ant-design/icons'
import { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../context'
import axios from 'axios'
import { useSendTransaction, useWaitForTransaction } from "wagmi"
import BitcoinLogo from '../images/bitcoin.png'
import { factoryWalletAddress, formatTime, formatOrderStatus, defaultToken, isStringEqual } from '../utils/constants'
import { addLiquidityApi, getBalanceApi, swapApi, BTCTestExplorerUrl } from '../utils/apiRoutes'
import { orderStatusArray, ORDER_STATUS_LISTED, ORDER_STATUS_PROCESSING, ORDER_STATUS_FINALIZING, ORDER_STATUS_FAILED, ORDER_STATUS_CONFIRMED } from '../utils/constants'
import useGetPool from '../hooks/useGetPool'


const tokenSend = (text, record, index, id) => {
  const status = record.order_status;
  const transfer = record.in_transfer;
  const inscriptionId = transfer ? transfer.inscription : {};
  const disabled = ((status == ORDER_STATUS_LISTED) || localStorage.getItem(inscriptionId) == 'true')
  console.log('disabled', status);
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

function Swap(props) {

  const { setHeaderId, address, tokenList, connected, getTokenBalance, orderList, fetchOrderList } = useAppContext();
  const [setTokenPair, currentPool, loading, error,] = useGetPool();
  const inputRef = useRef();
  const [keyword, setKeyword] = useState('');

  const [slippage, setSlippage] = useState(2.5)
  const [messageApi, contextHolder] = message.useMessage()
  const [tokenOneAmount, setTokenOneAmount] = useState(0)
  const [tokenTwoAmount, setTokenTwoAmount] = useState(0)
  const [tokenOne, setTokenOne] = useState(defaultToken)
  const [tokenTwo, setTokenTwo] = useState(defaultToken)
  const [isOpen, setIsOpen] = useState(false)
  const [changeToken, setChangeToken] = useState(1)

  const [tokenSelectList, setTokenSelectList] = useState([[], [], []])

  useEffect(() => {
    setHeaderId(3)
  }, [])

  useEffect(() => {
    let array = [];
    array.push(tokenList.filter((token) => !isStringEqual(token.tick, tokenTwo.tick)))
    array.push(tokenList.filter((token) => !isStringEqual(token.tick, tokenOne.tick)))
    setTokenSelectList([...array]);
    setTokenPair([tokenOne, tokenTwo]);
  }, [tokenOne, tokenTwo])

  useEffect(() => {
    console.log('currentPool :>> ', currentPool, error);
  }, [currentPool, error])

  useEffect(() => {
    setTokenOne(tokenList[0] || defaultToken)
    setTokenTwo(tokenList[1] || defaultToken)
  }, [tokenList])

  const swapOrderList = orderList.filter((order) => order.order_type === 4)
  const sortedOrderList = swapOrderList.sort((a, b) => b.ordered_time - a.ordered_time)

  const columns = [
    {
      title: 'No',
      width: 50,
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Swap',
      dataIndex: 'swap',
      key: 'swap',
      width: 90,
      render: (text, record, index) => record.in_token?.toUpperCase() + '/' + record.out_token?.toUpperCase()
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
      width: 80
    },
    {
      title: 'Token1 Amount',
      dataIndex: 'in_amount',
      key: 'in_amount',
      width: 120,
    },
    {
      title: 'Ordered Time',
      dataIndex: 'ordered_time',
      key: 'ordered_time',
      width: 120,
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

  const handleSlippage = (e) => {
    setSlippage(e.target.value)
  }

  const changeAmount = (e) => {
    setTokenOneAmount(e.target.value);
    let rate = 0;
    if (currentPool && !currentPool.balance1 && !currentPool.balance2) rate = currentPool.balance2 / currentPool.balance1;
    if (e.target.value) {
      setTokenTwoAmount((e.target.value * rate).toFixed(2))
    } else
      setTokenTwoAmount(0)
  }

  const switchTokens = () => {
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
    // setPrices(null)
    // setTokenOneAmount(0)
    // setTokenTwoAmount(0)
    if (changeToken === 1) {
      setTokenOne(tokenSelectList[0][i])
    } else {
      setTokenTwo(tokenSelectList[1][i])
    }
    setIsOpen(false)
    setKeyword('')
  }

  const handleSwap = async () => {
    try {
      messageApi.open({
        type: 'warning',
        content: `Ordering swap for ${tokenOne.tick.toUpperCase()}/${tokenTwo.tick.toUpperCase()}`,
        duration: 20
      });
      const tx_id = await window.unisat.sendBitcoin(factoryWalletAddress, 1000);
      const body = {
        fee_txid: tx_id,
        fee_rate: 1,
        in_token: tokenOne.tick,
        out_token: tokenTwo.tick,
        in_amount: tokenOneAmount,
        out_amount: tokenTwoAmount,
        sender_address: address,
      }
      const { data } = await axios.post(swapApi, body);
      console.log('handleSwapRes===>', data);
      if (data.status == 'success') {
        messageApi.destroy();
        messageApi.open({
          type: 'success',
          content: 'New swap successfuly was ordered!',
          duration: 3
        });
        await fetchOrderList();
      }
      else {
        messageApi.destroy();
        messageApi.open({
          type: 'error',
          content: 'New swap order Failed!',
          duration: 5
        })
      }
    } catch (error) {
      messageApi.destroy();
      messageApi.open({
        type: 'error',
        content: 'New swap order Failed!',
        duration: 5
      })
    }
  }

  const settingsContent = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group onChange={handleSlippage} value={slippage}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  )

  const isSwapDisabled = !connected || tokenOne.tick == defaultToken.tick || tokenTwo.tick == defaultToken.tick || tokenOneAmount == 0 || tokenTwoAmount == 0 || !currentPool
  return (
    <>
      {contextHolder}
      <Modal open={isOpen} footer={null} onCancel={() => { setIsOpen(false) }} title="Select a token">
        <Input
          ref={inputRef}
          placeholder='' value={keyword} onChange={(e) => { setKeyword(e.target.value) }} />
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
      <Row justify='center' className='w-100'>
        <Col xl={8} className='p-2'>
          <Row justify='center'>
            <div className='tradeBox'>
              <div className='tradeBoxHeader'>
                <Row justify='center' className='w-100'>
                  <h2>Swap</h2>
                </Row>
                <Popover
                  title='Settings'
                  trigger='click'
                  placement='bottomRight'
                  content={settingsContent}
                >
                  <SettingOutlined className='cog' />
                </Popover>
              </div>
              <Row justify='center' className='w-100'>
                <span>Pool info : {currentPool ? `LP token ${currentPool.lp_token}` : 'No pool exists'}</span>
              </Row>
              <div className='inputs'>
                <Input
                  placeholder='0.00'
                  value={tokenOneAmount}
                  onChange={changeAmount}
                  onFocus={(event) => { event.target.select() }}
                />
                <Input
                  placeholder='0.00'
                  value={tokenTwoAmount}
                  disabled={true}
                  onFocus={(event) => { event.target.select() }}
                />
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
              <Popconfirm
                title="Are you sure to Swap?"
                description={`Are you sure to swap ${tokenOne.tick.toUpperCase()}/${tokenTwo.tick.toUpperCase()}?`}
                onConfirm={handleSwap}
                // onCancel={createPool}
                okText="Yes"
                cancelText="No"
                disabled={isSwapDisabled}
              >
                <Tooltip
                  title={currentPool && currentPool.balance1 > 0 ? "Swap" : "No pool exists"}
                >
                  <div className='swapButton'
                    // onClick={handleSwap}
                    disabled={isSwapDisabled}
                  >
                    Swap
                  </div>
                </Tooltip>
              </Popconfirm>
            </div>
          </Row>
        </Col>
        <Col xl={16}>
          <Row justify='center' className='w-100'>
            <Col span={23}>
              <Row>
                <div className='table-title text-align-left p-2'>Order List</div>
              </Row>
              <Table
                columns={columns}
                dataSource={sortedOrderList}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  )
}

export default Swap