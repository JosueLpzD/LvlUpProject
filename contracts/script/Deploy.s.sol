// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Deploy Script
 * @notice Despliega LvlUpToken y HabitStaking en la red
 * 
 * Uso en testnet:
 *   forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast
 * 
 * Uso en mainnet:
 *   forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
 */

import "forge-std/Script.sol";
import "../src/tokens/LvlUpToken.sol";
import "../src/rewards/HabitStaking.sol";

contract DeployScript is Script {
    function run() external {
        // Leer la clave privada del deployer desde el entorno
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Desplegar LvlUpToken con supply inicial de 1 millón para liquidez
        uint256 initialSupply = 1_000_000 * 10**18;
        LvlUpToken token = new LvlUpToken(initialSupply);
        
        console.log("LvlUpToken desplegado en:", address(token));
        console.log("Supply inicial:", initialSupply / 10**18, "LVLUP");
        
        // 2. Desplegar HabitStaking
        // Parámetros: token, 1 LVLUP por hábito, ciclo de 7 días
        uint256 rewardPerHabit = 1 * 10**18;     // 1 token
        uint256 stakeDuration = 7 days;            // 7 días en segundos
        
        HabitStaking staking = new HabitStaking(
            address(token),
            rewardPerHabit,
            stakeDuration
        );
        
        console.log("HabitStaking desplegado en:", address(staking));
        
        // 3. Dar MINTER_ROLE al contrato de staking
        // Para que pueda crear tokens de bonus si es necesario en el futuro
        token.grantRole(token.MINTER_ROLE(), address(staking));
        
        console.log("MINTER_ROLE otorgado a HabitStaking");
        
        vm.stopBroadcast();
        
        // Resumen
        console.log("");
        console.log("=== DEPLOY COMPLETADO ===");
        console.log("Token:", address(token));
        console.log("Staking:", address(staking));
    }
}
