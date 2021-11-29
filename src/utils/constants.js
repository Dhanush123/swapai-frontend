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

export {
  MAX_GAS_LIMIT,
  TUSD_KOVAN_ADDRESS, WBTC_KOVAN_ADDRESS, CONTRACT_ADDRESS,
  ERC20_TOKEN_ABI, SWAPAI_ABI,
}
