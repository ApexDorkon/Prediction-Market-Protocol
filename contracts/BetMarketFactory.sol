// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BetCampaign.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BetMarketFactory
 * @notice Factory for trustless deployment of binary prediction markets.
 * @dev Implements a creation-stake model to prevent spam and seed initial liquidity.
 */
contract BetMarketFactory {
    using SafeERC20 for IERC20;

    event CampaignDeployed(uint256 indexed id, address indexed creator, address campaign, uint256 potSeeded);

    IERC20  public immutable usdc;
    address public immutable treasury;
    address public immutable oracle;
    uint256 public immutable creationStake;

    uint256 public nextId = 1;
    mapping(uint256 => address) public campaigns;

    constructor(address _usdc, address _treasury, address _oracle, uint256 _stake) {
        usdc = IERC20(_usdc);
        treasury = _treasury;
        oracle = _oracle;
        creationStake = _stake;
    }

    /**
     * @notice Deploys a new prediction market. 
     * @dev 95% of the creation stake seeds the pool; 5% goes to the protocol treasury.
     */
    function createCampaign(string memory name, string memory symbol, uint64 endTime, uint16 feeBps) 
        external returns (address campaign) 
    {
        uint256 id = nextId++;
        BetCampaign c = new BetCampaign(msg.sender, address(usdc), treasury, oracle, name, symbol, endTime, feeBps);
        campaigns[id] = address(c);

        usdc.safeTransferFrom(msg.sender, address(this), creationStake);
        uint256 toTreasury = (creationStake * 500) / 10000;
        uint256 toCampaign = creationStake - toTreasury;

        usdc.safeTransfer(treasury, toTreasury);
        usdc.safeTransfer(address(c), toCampaign);
        c.seedInitialPot(toCampaign);

        emit CampaignDeployed(id, msg.sender, address(c), toCampaign);
        return address(c);
    }
}