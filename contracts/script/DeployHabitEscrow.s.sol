// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/finance/HabitEscrow.sol";

contract DeployHabitEscrow is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // La dirección del backend que firmará (Oráculo)
        // Por defecto usaré la del deployer o una específica si está en .env
        // Para este caso, usaré la del deployer como admin y una nueva para el oráculo si quisiera,
        // pero para simplificar usaré la misma que tengo en backend (.env SIGNER_PRIVATE_KEY -> address)
        // Como no tengo fácil acceso a esa address aquí sin saberla, usaré un par de config.
        
        // IMPORTANTE: Esta dirección debe coincidir con la que genera `signer_service` en backend.
        // Voy a asumir que el usuario configurará esto después o usaré una variable de entorno.
        address oracleSigner = vm.envAddress("ORACLE_SIGNER"); 
        
        // Tesorería (Puede ser el mismo deployer por ahora)
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        HabitEscrow escrow = new HabitEscrow(oracleSigner, treasury);

        console.log("HabitEscrow deployed at:", address(escrow));
        console.log("Oracle Signer:", oracleSigner);
        
        vm.stopBroadcast();
    }
}
