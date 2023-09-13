import { RpcProvider,Account} from "starknet";
import { ethers} from "ethers";
import config from "./wallet.json" assert {type: 'json'};

const sleep = (delay) => new Promise(resolve=>setTimeout(resolve,delay))
const provider = new RpcProvider({nodeUrl:config.rpc})
const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

async function getTransferFee(privateKey,address,to,amount){
    
    const account = new Account(
        provider,
        address,
        privateKey
    );

    const { suggestedMaxFee: estimatedFee1 } = await account.estimateInvokeFee({
        contractAddress: ethAddress,
        entrypoint: "transfer",
        calldata: [
            to,
            amount,
            "0"
        ]
    });

    const fee = ethers.utils.formatEther(estimatedFee1)
    // console.log(`转账费用为 ${fee} ETH`);
    return estimatedFee1
}

async function transferETH(to,amount,privateKey,address){ //转账以太
    if (to.length != 66) {
        throw new Error('address format error')
    }
    let balance  = await provider.callContract({
        contractAddress:ethAddress,
        entrypoint:"balanceOf",
        calldata:[
            address
        ]
    })

    balance= ethers.utils.formatUnits(balance.result[0],18)
    console.log(`当前余额为${balance}`);
    if (amount>balance) {
        throw new Error('余额不足')
    }

    const account = new Account(
        provider,
        address,
        privateKey
    );

    await account.execute(
        [
            {
                contractAddress: ethAddress,
                entrypoint: "transfer",
                calldata:[
                    to,
                    amount*10**18,
                    "0"
                ]
            }
        ]
    )
    console.log(`已转账${amount}至${to}`);
}

async function transferAllETH(to,privateKey,address){ //转账所有以太
    if (to.length != 66) {
        throw new Error('address format error')
    }
    const account = new Account(
        provider,
        address,
        privateKey
    );

    let balance  = await provider.callContract({
        contractAddress:ethAddress,
        entrypoint:"balanceOf",
        calldata:[
            address
        ]
    })

    // console.log(`当前余额为${ethers.utils.formatUnits(balance.result[0],18)}`);

    balance= ethers.utils.formatUnits(balance.result[0],0)

    const fee = await getTransferFee(privateKey,address,to,balance)

    await account.execute(
        [
            {
                contractAddress: ethAddress,
                entrypoint: "transfer",
                calldata: [
                    to,
                    (Number(balance)-Number(fee)).toString(),
                    "0"
                ]
            }
        ]
    )
    console.log(`已转账所有以太至${to}`);
}