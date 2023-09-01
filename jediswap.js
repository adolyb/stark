import {RpcProvider, Account, CallData, cairo} from "starknet";
import axios from "axios";
import wallet from "./wallet.json" assert {type: 'json'};

const sleep = (delay) => new Promise(resolve=>setTimeout(resolve,delay))
const provider = new RpcProvider({nodeUrl:wallet.rpc})
const response = await axios.get('https://min-api.cryptocompare.com/data/price', {
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
const ethPrice = response.data.USD

async function swapEthToUsdc(privateKey,accountAddress,amount,slippage=0.99){ //privatekey-私钥，amount-你要兑换的以太数量，slippage-滑点不能超过1
    const account = new Account(
        provider,
        accountAddress,
        privateKey
    );
    try {
        const multiCall = await account.execute(
            [
                {
                    contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
                    entrypoint: "approve",
                    calldata: CallData.compile({
                        spender: '0x041fd22b238fa21cfcf5dd45a8548974d8263b3a531a60388411c5e230f97023',
                        amount: cairo.uint256(amount*10**18),
                    })
                },
                {
                    contractAddress: '0x041fd22b238fa21cfcf5dd45a8548974d8263b3a531a60388411c5e230f97023',
                    entrypoint: "swap_exact_tokens_for_tokens",
                    calldata:[
                        amount*10**18,
                        "0",
                        Math.round(amount*ethPrice*10**6*slippage),
                        "0",
                        2,
                        "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                        "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
                        accountAddress,
                        (Math.round(Date.now() / 1000)+200).toString()
                    ]
                }
            ]
        )
        // await sleep(53456)
        await provider.waitForTransaction(multiCall.transaction_hash,{successStates:["ACCEPTED_ON_L2"]});
        console.log(`已提交swap，请在区块链浏览器查看`);

        
    }catch (err){
        console.log(err.message)
    }
}

export default swapEthToUsdc