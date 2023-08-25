import { RpcProvider,Account,CallData} from "starknet";
import { ethers} from "ethers";
import config from "./wallet.json" assert {type: 'json'};

const sleep = (delay) => new Promise(resolve=>setTimeout(resolve,delay))
const provider = new RpcProvider({nodeUrl:config.rpc})
const ethAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

async function getTransferFee(privateKey,address){
    
    const account = new Account(
        provider,
        address,
        privateKey
    );

    const { suggestedMaxFee: estimatedFee1 } = await account.estimateInvokeFee({
        contractAddress: ethAddress,
        entrypoint: "transfer",
        calldata: [
            "0x06c788c9c1a1917c460a28f71ee8601abb0d2ee203a41f7da00e4237935355c0",
            100,
            "0"
        ]
    });

    const fee = ethers.utils.formatEther(estimatedFee1)
    console.log(`转账费用为 ${fee} ETH`);
    return estimatedFee1
}

async function transferETH(to,amount,privateKey,address){
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
}

async function transferAllETH(to,privateKey,address){
    if (to.length != 66) {
        throw new Error('address format error')
    }
    const account = new Account(
        provider,
        address,
        privateKey
    );
    const fee = await getTransferFee(privateKey,address)* 11n / 10n

    let balance  = await provider.callContract({
        contractAddress:ethAddress,
        entrypoint:"balanceOf",
        calldata:[
            address
        ]
    })

    balance= ethers.utils.formatUnits(balance.result[0],0)

    await account.execute(
        [
            {
                contractAddress: ethAddress,
                entrypoint: "transfer",
                calldata: [
                    to,
                    Number(balance)-Number(fee),
                    "0"
                ]
            }
        ]
    )
}