import {RpcProvider, Account, CallData, cairo} from "starknet";
import balanceOf from "./usdc.js"
import axios from "axios";
import { ethers } from "ethers";
import wallet from "./wallet.json" assert {type: 'json'};

const sleep = (delay) => new Promise(resolve=>setTimeout(resolve,delay))
const provider = new RpcProvider({nodeUrl:wallet.rpc})
const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
const marketAddress = '0x04c0a5193d58f74fbace4b74dcf65481e734ed1714121bdc571da345540efa05';
const usdcaddress = "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";

//获取ETH的价格
const res = await axios.get('https://min-api.cryptocompare.com/data/price', {
  params: {
    'fsym': 'ETH',
    'tsyms': 'USD'
  },
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en,zh-CN;q=0.9,zh;q=0.8',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
  }
});
const ethPrice = res.data.USD

async function depositETH(privateKey,accountAddress,amount){
    const account = new Account(
        provider,
        accountAddress,
        privateKey
      );
    try {
        const multiCall = await account.execute(
            [
                {
                    contractAddress: ethAddress,
                    entrypoint: "approve",
                    calldata: CallData.compile({
                        spender: marketAddress,
                        amount: cairo.uint256(amount*10**18),
                    })
                },
                {
                    contractAddress: marketAddress,
                    entrypoint: "deposit",
                    calldata: CallData.compile({
                        token: ethAddress,
                        amount:amount*10**18
                    })
                },
                {
                    contractAddress: marketAddress,
                    entrypoint: "enable_collateral",
                    calldata: CallData.compile({
                        token: ethAddress
                    })
                }

            ]
        )
        // await provider.waitForTransaction(multiCall.transaction_hash);
        // await sleep(56300)
        console.log("存入ETH成功");
    }catch (err){
        console.log(err.message)
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function borrowUSDC(privateKey,accountAddress) { //判断存入资产，但是没有计算USDC的debt，默认是你的之前没借过款的。所以用之前最好还清UDSC或者还到剩一点点

    const response = await axios.get(`https://data.app.zklend.com/users/${accountAddress}/all`, {
            headers: {
                'authority': 'data.app.zklend.com',
                'accept': '*/*',
                'accept-language': 'en,zh-CN;q=0.9,zh;q=0.8',
                'access-control-allow-origin': '*',
                'content-type': 'application/json',
                'origin': 'https://app.zklend.com',
                'referer': 'https://app.zklend.com/',
                'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });
    const supply = ethers.utils.formatUnits(response.data.pools[0].data.supply_amount,18)
    
    const account = new Account(
        provider,
        accountAddress,
        privateKey
      );
    
    while (true) {
        if (supply!=0) {
            const amt = Math.round(supply*ethPrice*10**6*getRandomInt(500,700)/1000) //随机借钱，这里默认是50%-70%，可以自己改，最好别超过75%。
            try{
                await account.execute(
                    [
                        {
                            contractAddress:marketAddress,
                            entrypoint:"borrow",
                            calldata:[
                                "2368576823837625528275935341135881659748932889268308403712618244410713532584",
                                amt
                            ]
                        },
                    ]
                )
                // await sleep(69280)
                console.log(`成功借出${amt/10**6} USDC`);
                // await provider.waitForTransaction(multiCall.transaction_hash);
            }catch(e){
                console.log(e.message);
            }
            break
        }else{
            console.log("无抵押物");
        }
    }
}

async function repayAll(privateKey,accountAddress) {
    const account = new Account(
        provider,
        accountAddress,
        privateKey
      );
    const balance = await balanceOf(accountAddress)
    try{
        await account.execute(
            [
                {
                    contractAddress:usdcaddress,
                    entrypoint:"approve",
                    calldata:[
                        marketAddress,
                        balance,
                        "0"
                    ]
                },
                {
                    contractAddress:marketAddress,
                    entrypoint:"repay_all",
                    calldata:[
                        "2368576823837625528275935341135881659748932889268308403712618244410713532584"
                    ]
                }
            ]
        )
        // await provider.waitForTransaction(multiCall.transaction_hash);
        // await sleep(60300)
        const response = await axios.get(`https://data.app.zklend.com/users/${accountAddress}/all`, {
            headers: {
                'authority': 'data.app.zklend.com',
                'accept': '*/*',
                'accept-language': 'en,zh-CN;q=0.9,zh;q=0.8',
                'access-control-allow-origin': '*',
                'content-type': 'application/json',
                'origin': 'https://app.zklend.com',
                'referer': 'https://app.zklend.com/',
                'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });
        const debt = ethers.utils.formatUnits(response.data.pools[1].data.debt_amount,6)
        console.log(`成功还款USDC,剩余未还USDC为${debt}`);
    }catch(e){
        console.log(e.message);
    }
}

async function withdrawAll(privateKey,accountAddress) {
    const account = new Account(
        provider,
        accountAddress,
        privateKey
      );
    try{
        await account.execute(
            [
                {
                    contractAddress:marketAddress,
                    entrypoint:"withdraw_all",
                    calldata:[
                        ethAddress
                    ]
                }
            ]
        )
        // await provider.waitForTransaction(multiCall.transaction_hash);
        // await sleep(120000)
        console.log("已取出所有以太");
    }catch(e){
        console.log(e.message);
    }
}

// withdrawAll(wallet.privatekey,wallet.address)

export {withdrawAll,repayAll,borrowUSDC,depositETH}
