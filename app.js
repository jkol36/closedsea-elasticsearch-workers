
import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import nfts from './nfts.json';
import Web3 from 'web3';
import closedSeaNFTABI from './closedSeaNFT';
import ClosedSeaTokenABI from './closedSeaToken';
import NftControllerABI from './nftController';
import EthPriceChainlinkABI from "./ethPriceChainlink";
import axios from 'axios';
import { artifacts } from './config';
dotenv.config();
const client = new Client({
  cloud: {
    id: process.env.ELASTIC_SEARCH_CLOUD_ID
  },
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  }
})

const indexNfts = async () => {
	const web3Provider = new Web3(Web3.givenProvider)
	web3Provider.setProvider('https://bsc-dataseed.binance.org/')
	const closedSeaNFT = new web3Provider.eth.Contract(closedSeaNFTABI, artifacts.closedSeaNft[parseInt(process.env.REACT_APP_DEFAULT_CHAINID)]);
	const closedSeaToken = new web3Provider.eth.Contract(ClosedSeaTokenABI, artifacts.seaToken[parseInt(process.env.REACT_APP_DEFAULT_CHAINID)]);
    const nftController = new web3Provider.eth.Contract(NftControllerABI, artifacts.nftController[parseInt(process.env.REACT_APP_DEFAULT_CHAINID)]);
    const ethPriceChainlink = new web3Provider.eth.Contract(EthPriceChainlinkABI, artifacts.ethPriceChainlink[parseInt(process.env.REACT_APP_DEFAULT_CHAINID)]);
	//console.log('nft controller methods', nftController.methods)
	const asks = await nftController.methods.getAsks().call()
	let nfts = [];
    for(let item of asks) {
      let tItem = { tokenAddr: item[0], tokenId: item[1], price: item[2] };
      if (closedSeaNFT) {
        const uri = await closedSeaNFT.methods.tokenURI(tItem.tokenId).call();
        const result = await axios.get(uri);
        tItem = { ...tItem, ...result.data, tokenUri: uri };
        nfts = [...nfts, tItem];
      }
    };
    nfts.forEach(async nft => {
    	await client.index({index: 'closedsea-nft', body: nft})
    })
    await client.indices.refresh({index: 'closedsea-nft'})
}

const searchForNftByName = async name => {
	const { body } = await client.search({
		index: 'closedsea-nft',
		body: {
			"query": {
				"match": {
					name
				}
			}
		}
	})
	console.log(body.hits.hits)
	return body.hits.hits

}

indexNfts()
const results = searchForNftByName('FOOTIE+')
console.log(results)
