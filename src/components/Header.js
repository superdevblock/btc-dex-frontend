import React, { useState } from 'react'
import Bitcoin from '../images/bitcoin.png'
import Logo from '../logo.png'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context'

function Header(props) {
  const { connected, address, connectWallet } = useAppContext();
  const { headerId, setHeaderId } = useAppContext();
  return (
    <header className='leftH'>
      <div className='d-flex'>
        <img src={Logo} alt='eth' width={'300px'} className='logo' />
        <Link to='/' className='link' onClick={() => { setHeaderId(0) }}>
          <div className={`headerItem ${headerId == 0 && 'headerItem-selected'}`}>Create new liquidity pool</div>
        </Link>
        <Link to='/AddLq' className='link' onClick={() => { setHeaderId(1) }}>
          <div className={`headerItem ${headerId == 1 && 'headerItem-selected'}`}>Add liquidity</div>
        </Link>
        <Link to='/RemoveLq' className='link' onClick={() => { setHeaderId(2) }}>
          <div className={`headerItem ${headerId == 2 && 'headerItem-selected'}`}>Remove liquidity</div>
        </Link>
        <Link to='/swap' className='link' onClick={() => { setHeaderId(3) }}>
          <div className={`headerItem ${headerId == 3 && 'headerItem-selected'}`}>Swap</div>
        </Link>
        {/* <Link to='/airdrop' className='link' onClick={() => { setHeaderId(4) }}>
          <div className={`headerItem ${headerId == 4 && 'headerItem-selected'}`}>Airdrop</div>
        </Link> */}
        <Link to='/info' className='link' onClick={() => { setHeaderId(4) }}>
          <div className={`headerItem ${headerId == 4 && 'headerItem-selected'}`}>Info</div>
        </Link>
        {/* <Link to='/docs' className='link'>
          <div className='headerItem'>Docs</div>
        </Link> */}
      </div>
      <div className='rightH'>
        <div className='headerItem'>
          <img src={Bitcoin} alt='eth' className='logo' />
          BRC-20
        </div>
        <div className='connectButton'
          onClick={connectWallet}
        >{connected ? (address.slice(0, 4) + "..." + address.slice(38)) : "Connect"}</div>
      </div>
    </header>
  )
}

export default Header