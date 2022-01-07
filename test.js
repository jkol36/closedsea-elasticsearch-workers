import { expect } from 'chai';
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
 
describe.only('nfts', async () => {
	it('should get all nfts', async () => {
		const web3Provider = new Web3(Web3.givenProvider)
		web3Provider.setProvider('https://bsc-dataseed.binance.org/')
		const closedSeaNFT = new web3Provider.eth.Contract(closedSeaNFTABI, artifacts.closedSeaNft[parseInt(process.env.REACT_APP_DEFAULT_CHAINID)]);
		const closedSeaToken = new web3Provider.eth.Contract(ClosedSeaTokenABI, artifacts.seaToken[parseInt(process.env.REACT_APP_DEFAULT_CHAINID)]);
    const nftController = new web3Provider.eth.Contract(NftControllerABI, artifacts.nftController[parseInt(process.env.REACT_APP_DEFAULT_CHAINID)]);
    const ethPriceChainlink = new web3Provider.eth.Contract(EthPriceChainlinkABI, artifacts.ethPriceChainlink[parseInt(process.env.REACT_APP_DEFAULT_CHAINID)]);
		//console.log('nft controller methods', nftController.methods)
		const asks = await nftController.methods.getAsks().call()
		let temp = [];
    for(let item of asks) {
      let tItem = { tokenAddr: item[0], tokenId: item[1], price: item[2] };
      if (closedSeaNFT) {
        const uri = await closedSeaNFT.methods.tokenURI(tItem.tokenId).call();
        const result = await axios.get(uri);
        tItem = { ...tItem, ...result.data, tokenUri: uri };
        temp = [...temp, tItem];
      }
    };
    console.log(temp)
    expect(temp.length).to.be.gt(0)
    expect(Object.keys(temp[0])[0]).to.eq('tokenAddr')
		//console.log('closedSeaNFt', closedSeaNFT)
		//console.log('closedSeaToken', closedSeaToken)
		//console.log('nftController', nftController)
		//console.log('ethPriceChainLink', ethPriceChainlink)
	})
})

describe('elastic search', async () => {
	it('should get client info', async () => {
		const info = await client.info()
		expect(info.statusCode).to.eq(200)
	})
	it('should index some nfts', async () => {
		await client.index({index: 'closedsea-nft', body: nfts[0]})
		await client.index({index: 'closedsea-nft', body: nfts[1]})
		await client.indices.refresh({index: 'closedsea-nft'})
	})
	it('should search for some nfts', async () => {
		const { body } = await client.search({
			index: 'closedsea-nft',
			body: {
				"query": {
				"match": {
					name: 'GENESIS'
				}
			}
		}
		})
		console.log(body.hits.hits)
		expect(body.hits.hits.length).to.be.gt(0)
	})
})