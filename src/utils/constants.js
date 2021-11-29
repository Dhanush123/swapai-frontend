import contractData from '../contracts/contract-addresses.json';
import SwapAIArtifact from '../contracts/SwapAI.json';

const MAX_GAS_LIMIT = 250_000;

const TUSD_KOVAN_ADDRESS = contractData['TUSDToken'];
const WBTC_KOVAN_ADDRESS = contractData['WBTCToken'];
const CONTRACT_ADDRESS   = contractData['SwapAI'];

const ERC20_TOKEN_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function decimals() public returns (uint8)',
];

const SWAPAI_ABI = SwapAIArtifact.abi;

const PRICE_FEED_BTC_ADDRESS = '0xAe74faA92cB67A95ebCAB07358bC222e33A34dA7';
const BTC_DECIMALS = 8;

export {
  MAX_GAS_LIMIT,
  TUSD_KOVAN_ADDRESS, WBTC_KOVAN_ADDRESS, CONTRACT_ADDRESS,
  ERC20_TOKEN_ABI, SWAPAI_ABI,
  PRICE_FEED_BTC_ADDRESS, BTC_DECIMALS
}
