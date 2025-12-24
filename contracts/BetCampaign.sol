// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BetCampaign
 * @notice Binary prediction market using NFT-based tickets.
 * Winning tickets represent a proportional share of the losing side's pool.
 */
contract BetCampaign is ERC721URIStorage, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Side { FalseSide, TrueSide }
    enum State { Open, Resolved, Canceled }

    struct Ticket { Side side; uint256 stake; bool claimed; }

    IERC20  public immutable usdc;
    address public immutable oracle;
    uint64  public immutable endTime;
    uint16  public immutable feeBps;

    State   public state = State.Open;
    bool    public outcomeTrue;
    uint256 public totalTrue;
    uint256 public totalFalse;
    uint256 public totalInitialPot;

    uint256 public nextTicketId = 1;
    mapping(uint256 => Ticket) public tickets;

    constructor(address _creator, address _usdc, address _treasury, address _oracle, string memory _n, string memory _s, uint64 _et, uint16 _f) 
        ERC721(_n, _s) Ownable() 
    {
        transferOwnership(_creator);
        usdc = IERC20(_usdc);
        oracle = _oracle;
        endTime = _et;
        feeBps = _f;
    }

    function join(Side side, uint256 amount) external nonReentrant {
        require(state == State.Open && block.timestamp < endTime, "Market Closed");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        
        if (side == Side.TrueSide) totalTrue += amount;
        else totalFalse += amount;

        uint256 id = nextTicketId++;
        _safeMint(msg.sender, id);
        tickets[id] = Ticket(side, amount, false);
    }

    function resolve(bool _outcomeTrue) external {
        require(msg.sender == oracle, "Oracle Only");
        require(block.timestamp >= endTime, "Early Resolution");
        state = State.Resolved;
        outcomeTrue = _outcomeTrue;
    }

    function claim(uint256 ticketId) external nonReentrant {
        require(ownerOf(ticketId) == msg.sender, "Not Ticket Owner");
        Ticket storage t = tickets[ticketId];
        require(state == State.Resolved && !t.claimed, "Cannot Claim");

        bool isWinner = (outcomeTrue && t.side == Side.TrueSide) || (!outcomeTrue && t.side == Side.FalseSide);
        require(isWinner, "Ticket Lost");

        t.claimed = true;
        uint256 winnersPool = outcomeTrue ? totalTrue : totalFalse;
        uint256 totalPool = totalTrue + totalFalse + totalInitialPot;
        uint256 fee = (totalPool * feeBps) / 10000;
        uint256 payout = (t.stake * (totalPool - fee)) / winnersPool;

        _burn(ticketId);
        usdc.safeTransfer(msg.sender, payout);
    }
    
    function seedInitialPot(uint256 amount) external {
        require(msg.sender == owner(), "Creator Only");
        totalInitialPot += amount;
    }
}