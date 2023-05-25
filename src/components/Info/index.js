import { Input, Popover, Radio, Modal, message, Table, Tooltip, Row } from 'antd'
import { ArrowDownOutlined, SettingOutlined } from '@ant-design/icons'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useSendTransaction, useWaitForTransaction } from "wagmi"
import BitcoinLogo from '../../images/bitcoin.png'
import { useAppContext } from '../../context'
import './index.css';
import { BTCTestExplorerUrl } from '../../utils/apiRoutes'

function Info(props) {

  const { setHeaderId, tokenList, poolList } = useAppContext();

  const [messageApi, contextHolder] = message.useMessage()

  const poolColumns = [
    {
      title: 'No',
      dataIndex: 'id',
      key: 'id',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Pool',
      dataIndex: 'pool',
      key: 'pool',
      width: 120,
      render: (text, record, index) => record.token1?.toUpperCase() + '/' + record.token2?.toUpperCase()
    },
    {
      title: 'LP Token',
      dataIndex: 'lp_token',
      key: 'lp_token',
      width: 100,
      render: (text, record, index) => text?.toUpperCase()
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (text, record, index) => (
        <Tooltip
          title={text?.toUpperCase()}
        >
          {text?.toUpperCase().slice(0, 8) + '...' + text?.toUpperCase().slice(-8)}
        </Tooltip>
      ),
    },
    {
      title: 'MAX',
      dataIndex: 'lp_max',
      key: 'lp_max',
      width: 100,
    }
  ];

  const tokenColumns = [
    {
      title: 'No',
      dataIndex: 'id',
      key: 'id',
      width: 10,
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Token',
      dataIndex: 'tick',
      key: 'tick',
      width: 40,
      render: (text, record, index) => text.toUpperCase(),
    },
    {
      title: 'Inscription',
      dataIndex: 'inscription',
      key: 'inscription',
      width: 50,
      render: (text, record, index) => (
        <Tooltip
          title={text}
        >
          {text?.toUpperCase().slice(0, 4) + '...' + text?.toUpperCase().slice(-4)}
        </Tooltip>
      ),
    },
    {
      title: 'Transaction',
      dataIndex: 'txid',
      key: 'txid',
      width: 120,
      render: (text, record, index) => (
        <a href={BTCTestExplorerUrl + text} target='_blank'>
          {text?.toUpperCase().slice(0, 6) + '...' + text?.toUpperCase().slice(-6)}
        </a>
      ),
    },
    {
      title: 'Lim',
      dataIndex: 'lim',
      key: 'lim',
    },
    {
      title: 'MAX',
      dataIndex: 'max',
      key: 'max',
    },
  ];

  useEffect(() => {
    setHeaderId(4);
  },)

  return (
    <Row className='createlq-page'>
      {contextHolder}
      <div>
        <div className='table-title text-align-left p-2'>All Pools</div>
        <Table
          dataSource={poolList}
          columns={poolColumns}
          pagination={{ pageSize: 10 }}
        />
      </div>
      <div>
        <div className='table-title text-align-left p-2'>All Tokens</div>
        <Table
          dataSource={tokenList}
          columns={tokenColumns}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </Row>
  )
}

export default Info