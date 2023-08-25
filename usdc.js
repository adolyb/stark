//这个用来查你的USDC余额的

import { RpcProvider} from "starknet";
import { ethers } from "ethers";
import wallet from "./wallet.json" assert {type: 'json'};

const provider = new RpcProvider({nodeUrl:wallet.rpc})
const usdcaddress = "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";

async function balanceOf(address){
    try{
        const res = await provider.callContract(
            {
                contractAddress:usdcaddress,
                entrypoint:"balanceOf",
                calldata:[
                    address
                ]
            }
        )
        const result= ethers.utils.formatUnits(res.result[0],0)
        return result
    }catch(e){
        console.log(e.message);
    }
}

export default balanceOf;