import { Input, Popover, Radio, Modal, message, Popconfirm, Row, Col, Table, Button, Tooltip } from 'antd'
import { ArrowDownOutlined, SettingOutlined } from '@ant-design/icons'
import { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../context'
import axios from 'axios'
import { useSendTransaction, useWaitForTransaction } from "wagmi"
import BitcoinLogo from '../images/bitcoin.png'
import { defaultToken, factoryWalletAddress, formatTime, formatOrderStatus } from '../utils/constants'
import { addLiquidityApi, getBalanceApi, swapApi, BTCTestExplorerUrl } from '../utils/apiRoutes'
import { orderStatusArray, ORDER_STATUS_LISTED, ORDER_STATUS_PROCESSING, ORDER_STATUS_FINALIZING, ORDER_STATUS_FAILED, ORDER_STATUS_CONFIRMED } from '../utils/constants'

function RemoveLq(props) {
  const inputRef = useRef();
  const { setHeaderId, address, tokenList, connected, getTokenBalance, orderList, fetchOrderList } = useAppContext();
  const [keyword, setKeyword] = useState('');

  const [slippage, setSlippage] = useState(2.5)
  const [messageApi, contextHolder] = message.useMessage()
  const [tokenOneAmount, setTokenOneAmount] = useState(0)
  const [tokenTwoAmount, setTokenTwoAmount] = useState(0)
  const [tokenOne, setTokenOne] = useState(defaultToken)
  const [tokenTwo, setTokenTwo] = useState(defaultToken)
  const [isOpen, setIsOpen] = useState(false)
  const [changeToken, setChangeToken] = useState(1)
  const [prices, setPrices] = useState({})
  const [txDetails, setTxDetails] = useState({
    to: null,
    data: null,
    value: null
  })

  const removeOrderList = orderList.filter((order) => order.order_type === 3)
  const sortedOrderList = removeOrderList.sort((a, b) => b.ordered_time - a.ordered_time)

  useEffect(() => {
    setHeaderId(2);
  }, [])
  useEffect(() => {
    setTokenOne(tokenList[0] || defaultToken)
    setTokenTwo(tokenList[1] || defaultToken)
  }, [tokenList])

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
  ];

  const { data, sendTransaction } = useSendTransaction({
    request: {
      from: address,
      to: String(txDetails.to),
      data: String(txDetails.data),
      value: String(txDetails.value)
    }
  })

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash
  })

  const handleSlippage = (e) => {
    setSlippage(e.target.value)
  }

  const changeAmount = (e) => {
    setTokenOneAmount(e.target.value)
    if (e.target.value && prices) {
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2))
    } else
      setTokenTwoAmount(0)
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
    setPrices(null)
    setTokenOneAmount(0)
    setTokenTwoAmount(0)
    if (changeToken === 1) {
      setTokenOne(tokenList[i])
      fetchDexSwap(tokenList[i].address, tokenTwo.address)
    } else {
      setTokenTwo(tokenList[i])
      fetchDexSwap(tokenOne.address, tokenList[i].address)
    }
    setIsOpen(false)
  }

  const fetchDexSwap = async (one, two) => {

  }

  useEffect(() => {
    messageApi.destroy()
    if (isLoading) {
      messageApi.open({
        content: 'Waiting for transaction to be mined',
        type: 'loading',
        duration: 0
      })
    }
  }, [isLoading])

  useEffect(() => {
    messageApi.destroy()
    if (isSuccess) {
      messageApi.open({
        type: 'success',
        content: 'Transaction Success',
        duration: 2
      })
    } else if (txDetails.to) {
      messageApi.open({
        type: 'error',
        content: 'Transaction Failed',
        duration: 2
      })
    }
  }, [isSuccess])

  useEffect(() => {
    if (txDetails.to && connected) {
      sendTransaction()
      message.success('Transaction sent')
    }
  }, [txDetails])

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

  const isDeleteDisabled = !connected || tokenOne.tick == defaultToken.tick || tokenTwo.tick || tokenOneAmount == 0 || tokenTwoAmount == 0
  return (
    <>
      {contextHolder}
      <Modal open={isOpen} footer={null} onCancel={() => { setIsOpen(false) }} title="Select a token">
        <Input
          onFocus={(event) => { event.target.select() }}
          ref={inputRef}
          placeholder='' value={keyword} onChange={(e) => { setKeyword(e.target.value) }} />
        <div className='modalContent'>
          {tokenList?.map((token, index) => {
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
          <Row justify='center' className='w-100'>
            <div className='tradeBox'>
              <div className='tradeBoxHeader'>
                <Row justify='center' className='w-100'>
                  <h2>Remove liquidity</h2>
                </Row>
              </div>
              <div className='inputs'>
                <Input placeholder='0'
                  type='number'
                  value={tokenOneAmount}
                  onChange={changeAmount}
                  onFocus={(event) => { event.target.select() }}
                />
                <div className='assetOne' onClick={() => openModal(1)}>
                  <img src={BitcoinLogo} alt="assetOnelogo" className='logo' />
                  {tokenOne.tick.toUpperCase()}
                </div>
              </div>
              <Popconfirm
                title="Are you sure to Remove?"
                description={`Are you sure to Remove ${tokenOne.tick.toUpperCase()}/${tokenTwo.tick.toUpperCase()}?`}
                // onConfirm={handleSwap}
                // onCancel={createPool}
                okText="Yes"
                cancelText="No"
                disabled={isDeleteDisabled}
              >
                <div
                  className='swapButton'
                  disabled={isDeleteDisabled}
                  style={{ marginTop: '30px' }}
                >
                  Remove liquidity
                </div>
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
                dataSource={sortedOrderList}
                columns={columns}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  )
}

export default RemoveLq