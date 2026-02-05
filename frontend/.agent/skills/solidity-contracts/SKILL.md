---
name: solidity-contracts
description: Smart contract development patterns, security, and OpenZeppelin usage. Use when writing or reviewing Solidity code.
---

# Solidity Contracts Skill

## Trigger
Use this skill when:
- Writing smart contracts
- Reviewing Solidity code
- Implementing ERC-20/ERC-721 tokens
- Optimizing gas usage

---

## Security Patterns

### 1. Checks-Effects-Interactions (CEI)
```solidity
// ✅ CORRECT - CEI Pattern
function withdraw(uint256 amount) external {
    // CHECKS
    require(balances[msg.sender] >= amount, "Insufficient");
    
    // EFFECTS
    balances[msg.sender] -= amount;
    
    // INTERACTIONS
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}

// ❌ WRONG - Vulnerable to reentrancy
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] -= amount; // Too late!
}
```

### 2. Reentrancy Guard
```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MyContract is ReentrancyGuard {
    function sensitiveFunction() external nonReentrant {
        // Protected from reentrancy
    }
}
```

### 3. Access Control
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Simple ownership
contract Simple is Ownable {
    function adminOnly() external onlyOwner {}
}

// Role-based access
contract Advanced is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    function mint(address to) external onlyRole(MINTER_ROLE) {}
}
```

---

## OpenZeppelin Templates

### ERC-20 Token
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LvlUpToken is ERC20, Ownable {
    constructor() ERC20("LvlUp", "LVLUP") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
```

### ERC-721 NFT
```solidity
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract AchievementNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    constructor() ERC721("LvlUp Achievement", "LVLACH") Ownable(msg.sender) {}
    
    function safeMint(address to, string memory uri) external onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
}
```

---

## Gas Optimization

| Technique | Savings | Example |
|-----------|---------|---------|
| Pack storage | ~20k gas | `uint128 a; uint128 b;` in same slot |
| Use `calldata` | ~200 gas | `function f(bytes calldata data)` |
| Cache array length | ~3 gas/iter | `uint len = arr.length;` |
| Custom errors | ~50 gas | `error Unauthorized();` |
| Unchecked math | ~40 gas | `unchecked { i++; }` |

```solidity
// ✅ Gas optimized
error InsufficientBalance(uint256 available, uint256 required);

function transfer(address to, uint256 amount) external {
    uint256 balance = balances[msg.sender];
    if (balance < amount) revert InsufficientBalance(balance, amount);
    
    unchecked {
        balances[msg.sender] = balance - amount;
        balances[to] += amount;
    }
}
```

---

## File Structure

```
contracts/
├── src/
│   ├── tokens/
│   │   ├── LvlUpToken.sol
│   │   └── AchievementNFT.sol
│   ├── rewards/
│   │   └── RewardsDistributor.sol
│   └── interfaces/
│       └── IRewards.sol
├── test/
│   └── LvlUpToken.t.sol
├── script/
│   └── Deploy.s.sol
└── foundry.toml
```

---

## Common Vulnerabilities

| Vulnerability | Prevention |
|---------------|------------|
| Reentrancy | ReentrancyGuard + CEI |
| Integer overflow | Solidity 0.8+ (built-in) |
| Unauthorized access | Ownable / AccessControl |
| Front-running | Commit-reveal scheme |
| tx.origin phishing | Use `msg.sender` only |
