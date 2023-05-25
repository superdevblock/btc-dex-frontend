const express = require('express')
const parser = require('body-parser')

const factory = require('./core/factory.js')
const pool = require('./core/pool.js')
const brc20Indexer = require('./core/brc20-indexer.js')
const orderbook = require('./core/orderbook.js')

const {
	FRONT_SERVER
} = require('./config.js')

///
const ERROR_UNKNOWN = "Unknown error"
const ERROR_INVALID_PARAMETER = 'Invalid parameter'
const ERROR_INVALID_TOKEN_NAME = 'Invalid token name'
const ERROR_INVALID_ADDRESS = 'Invalid address'
const ERROR_INVALID_LP_TOKEN = "Invalid LP token"
///

const app = express()

app.use(parser.urlencoded({ extended: false }))
app.use(parser.json())

app.get('/tokenlist', async function (req, res) {
	try {
		res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
		res.setHeader('Access-Control-Allow-Methods', 'GET')

		const tokenList = await brc20Indexer.getTokenList()

		res.send(JSON.stringify({ status: 'success', data: tokenList }))
	} catch (error) {
		console.log(error)
		res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
	}
})

app.get('/tokeninfo/:token', async function (req, res) {
	try {
		res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
		res.setHeader('Access-Control-Allow-Methods', 'GET')

		const token = req.params.token

		if (!token || token.length != 4) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
			return
		}

		const tokenInfo = await brc20Indexer.getTokenInfo(token)

		if (tokenInfo) {
			res.send(JSON.stringify({ status: 'success', data: tokenInfo }))
		} else {
			res.send(JSON.stringify({ status: 'error', description: 'No token info' }))
		}
	} catch (error) {
		console.log(error)
		res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
	}
})

app.get('/getbalance/:token/:address', async function (req, res) {
	try {
		res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
		res.setHeader('Access-Control-Allow-Methods', 'GET')

		const address = req.params.address
		const token = req.params.token

		if (!token || token.length != 4) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
			return
		}

		if (!address) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_ADDRESS }))
			return
		}

		const balance = await brc20Indexer.getBalance(token, address)

		res.send(JSON.stringify({ status: 'success', data: balance }))
	} catch (error) {
		console.log(error)
		res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
	}
})

app.get('/getpool', async function (req, res) {
	try {
		res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
		res.setHeader('Access-Control-Allow-Methods', 'GET')

		const poolInfo = await factory.getPoolInfo0()

		res.send(JSON.stringify({ status: 'success', data: poolInfo }))
	} catch (error) {
		console.log(error)
		res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
	}
})

app.get('/getpool/:token', async (req, res) => {
	try {
		res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
		res.setHeader('Access-Control-Allow-Methods', 'GET')

		const token = req.params.token

		if (!token || token.length != 4) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
			return
		}

		const poolInfo = await factory.getPoolInfo1(token)

		res.send(JSON.stringify({ status: 'success', data: poolInfo }))
	} catch (error) {
		console.log(error)
		res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
	}
})

app.get('/getpool/:token1/:token2', async (req, res) => {
	try {
		res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
		res.setHeader('Access-Control-Allow-Methods', 'GET')

		const token1 = req.params.token1
		const token2 = req.params.token2

		if (!token1 || !token2 || token1.length != 4 || token2.length != 4) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
			return
		}

		const poolInfo = await factory.getPoolInfo2(token1, token2)

		res.send(JSON.stringify({ status: 'success', data: poolInfo }))
	} catch (error) {
		console.log(error)
		res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
	}
})

app.post('/createpool', async function (req, res) {
	try {
		res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
		res.setHeader('Access-Control-Allow-Methods', 'POST')

		const senderAddress = req.body.sender_address
		const feeTxid = req.body.fee_txid
		const feeRate = req.body.fee_rate
		const token1 = req.body.token1
		const token2 = req.body.token2
		const lpToken = req.body.lp_token

		if (!senderAddress || !feeTxid || ! feeRate || !token1 || !token2 || !lpToken) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_PARAMETER }))
			return
		}

		if (token1.length != 4 || token2.length != 4 || lpToken.length != 4 || token1 === token2 || token1 === lpToken || token2 === lpToken) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
			return
		}

		await orderbook.orderCreatePool(token1, token2, lpToken, senderAddress, feeTxid, feeRate)

		res.send(JSON.stringify({ status: 'success' }))
	} catch (error) {
		console.error(error)
		res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
	}
})

app.post('/addliquidity', async function (req, res) {
	try {
		res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
		res.setHeader('Access-Control-Allow-Methods', 'POST')

		const senderAddress = req.body.sender_address
		const feeTxid = req.body.fee_txid
		const feeRate = req.body.fee_rate
		const token1 = req.body.token1
		const token2 = req.body.token2
		const amount1 = req.body.amount1
		const amount2 = req.body.amount2
		
		if (!senderAddress || !feeTxid || ! feeRate || !token1 || !token2 || !amount1 || !amount2) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_PARAMETER }))
			return
		}
		
		if (token1.length != 4 || token2.length != 4 || token1 === token2) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
			return
		}

		await orderbook.orderAddLiquidity(token1, token2, amount1, amount2, senderAddress, feeTxid, feeRate)

		res.send(JSON.stringify({ status: 'success' }))
	} catch (error) {
		console.error(error)
		res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
	}
})

app.post('/removeliquidity', async function (req, res) {
	try {
		res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
		res.setHeader('Access-Control-Allow-Methods', 'POST')

		const senderAddress = req.body.sender_address
		const feeTxid = req.body.fee_txid
		const feeRate = req.body.fee_rate
		const token1 = req.body.token1
		const token2 = req.body.token2
		const lpToken = req.body.lp_token
		const lpAmount = req.body.lp_amount
		
		if (!senderAddress || !feeTxid || ! feeRate || !token1 || !token2 || !lpToken || !lpAmount) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_PARAMETER }))
			return
		}
		
		if (token1.length != 4 || token2.length != 4 || lpToken.length != 4 || token1 === token2 || token1 === lpToken || token2 === lpToken) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
			return
		}

		await orderbook.orderRemoveLiquidity(token1, token2, lpToken, lpAmount, senderAddress, feeTxid, feeRate)

		res.send(JSON.stringify({ status: 'success' }))
	} catch (error) {
		console.error(error)
		res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
	}
})

app.post('/swap', async function (req, res) {
	try {
		res.setHeader('Access-Control-Allow-Origin', FRONT_SERVER)
		res.setHeader('Access-Control-Allow-Methods', 'POST')

		const senderAddress = req.body.sender_address
		const feeTxid = req.body.fee_txid
		const feeRate = req.body.fee_rate
		const inToken = req.body.in_token
		const outToken = req.body.out_token
		const inAmount = req.body.in_amount
		
		if (!senderAddress || ! feeTxid || !feeRate || !inToken || !outToken || !inAmount) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_PARAMETER }))
			return
		}
		
		if (inToken.length != 4 || outToken.length != 4 || inToken === outToken) {
			res.send(JSON.stringify({ status: 'error', description: ERROR_INVALID_TOKEN_NAME }))
			return
		}

		await orderbook.orderSwap(inToken, outToken, inAmount, senderAddress, feeTxid, feeRate)

		res.send(JSON.stringify({ status: 'success' }))
	} catch (error) {
		console.error(error)
		res.send(JSON.stringify({ status: 'error', description: ERROR_UNKNOWN }))
	}
})

module.exports = {
	app,
}
