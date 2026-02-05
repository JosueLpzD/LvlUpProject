---
name: foundry-testing
description: Smart contract testing with Foundry toolkit. Use when writing tests, running fuzz testing, or debugging contracts.
---

# Foundry Testing Skill

## Trigger
Use this skill when:
- Writing contract tests
- Running fuzz testing
- Debugging transactions
- Checking code coverage

---

## Foundry Commands

| Command | Purpose |
|---------|---------|
| `forge build` | Compile contracts |
| `forge test` | Run tests |
| `forge test -vvv` | Run with verbose output |
| `forge test --match-test testClaim` | Run specific test |
| `forge coverage` | Generate coverage report |
| `forge snapshot` | Gas snapshot |

---

## Test File Structure

```solidity
// test/LvlUpToken.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {LvlUpToken} from "../src/LvlUpToken.sol";

contract LvlUpTokenTest is Test {
    LvlUpToken public token;
    address public owner = address(this);
    address public user = address(0x1);
    
    function setUp() public {
        token = new LvlUpToken();
    }
    
    function test_InitialSupply() public view {
        assertEq(token.totalSupply(), 1_000_000 * 10**18);
    }
    
    function test_Transfer() public {
        token.transfer(user, 100);
        assertEq(token.balanceOf(user), 100);
    }
    
    function testFail_TransferInsufficientBalance() public {
        vm.prank(user);
        token.transfer(owner, 100); // Should fail
    }
}
```

---

## Cheatcodes (vm)

```solidity
// Change msg.sender for next call
vm.prank(user);
token.transfer(owner, 100);

// Change msg.sender for multiple calls
vm.startPrank(user);
token.approve(spender, 100);
token.transfer(owner, 50);
vm.stopPrank();

// Give ETH to an address
vm.deal(user, 10 ether);

// Mock block.timestamp
vm.warp(block.timestamp + 1 days);

// Mock block.number
vm.roll(block.number + 100);

// Expect a revert
vm.expectRevert("Insufficient balance");
token.transfer(user, 999999999);

// Expect an event
vm.expectEmit(true, true, false, true);
emit Transfer(owner, user, 100);
token.transfer(user, 100);
```

---

## Fuzz Testing

```solidity
// Foundry generates random inputs automatically
function testFuzz_Transfer(uint256 amount) public {
    // Bound amount to reasonable values
    amount = bound(amount, 1, token.balanceOf(owner));
    
    uint256 ownerBefore = token.balanceOf(owner);
    uint256 userBefore = token.balanceOf(user);
    
    token.transfer(user, amount);
    
    assertEq(token.balanceOf(owner), ownerBefore - amount);
    assertEq(token.balanceOf(user), userBefore + amount);
}
```

---

## Fork Testing

```solidity
// Test against mainnet state
function test_InteractWithUniswap() public {
    // Fork Base mainnet at specific block
    vm.createSelectFork("https://mainnet.base.org", 12345678);
    
    // Now you can interact with real deployed contracts
    IUniswapV3Pool pool = IUniswapV3Pool(POOL_ADDRESS);
    (uint160 sqrtPriceX96,,,,,,) = pool.slot0();
    
    assertTrue(sqrtPriceX96 > 0);
}
```

---

## Deployment Script

```solidity
// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {LvlUpToken} from "../src/LvlUpToken.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        LvlUpToken token = new LvlUpToken();
        console.log("Token deployed at:", address(token));
        
        vm.stopBroadcast();
    }
}
```

```bash
# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast

# Deploy and verify
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify
```

---

## Debugging

```bash
# Debug specific transaction
forge debug --debug src/Contract.sol:functionName

# Trace a transaction
cast run <tx_hash> --rpc-url $RPC_URL
```
