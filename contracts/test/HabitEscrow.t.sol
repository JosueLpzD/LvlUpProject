// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/finance/HabitEscrow.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract HabitEscrowTest is Test {
    HabitEscrow public escrow;
    
    address public owner;
    address public user;
    address public treasury;
    
    // Configuración del Signer (Oráculo)
    uint256 internal oraclePrivateKey;
    address internal oracleSigner;

    // TypeHash copiado del contrato para las pruebas
    bytes32 private constant SETTLEMENT_TYPEHASH = 
        keccak256("Settlement(address user,uint256 weekId,uint256 amountToReturn,uint256 deadline)");

    function setUp() public {
        owner = address(this);
        user = address(0x123);
        treasury = address(0x999);
        
        // Generar wallet para el oráculo
        oraclePrivateKey = 0xA11CE; 
        oracleSigner = vm.addr(oraclePrivateKey);

        // Desplegar contrato
        escrow = new HabitEscrow(oracleSigner, treasury);

        // Darle ETH al usuario de prueba
        vm.deal(user, 100 ether);
    }

    function testDeposit() public {
        vm.startPrank(user);
        uint256 weekId = 1;
        uint256 amount = 1 ether;

        escrow.deposit{value: amount}(weekId);

        // Verificar saldo en el contrato
        assertEq(address(escrow).balance, amount);
        // Verificar mapping
        assertEq(escrow.deposits(user, weekId), amount);
        
        vm.stopPrank();
    }

    function testWithdrawWithValidSignature() public {
        // 1. Setup: Usuario deposita 1 ETH
        uint256 weekId = 1;
        uint256 depositAmount = 1 ether;
        
        vm.prank(user);
        escrow.deposit{value: depositAmount}(weekId);
        
        // 2. Escenario: Usuario cumplió el 90% (Penalización 0.1 ETH)
        uint256 amountToReturn = 0.9 ether;
        uint256 penalty = 0.1 ether;
        uint256 deadline = block.timestamp + 1 hours;

        // 3. Generar Firma EIP-712 (Simulando Backend)
        bytes32 structHash = keccak256(abi.encode(
            SETTLEMENT_TYPEHASH,
            user,
            weekId,
            amountToReturn,
            deadline
        ));

        // Obtener el Domain Separator del contrato deployed
        bytes32 domainSeparator = escrow.getDomainSeparator();
        
        // Hashing final (EIP-712)
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);
        
        // Firmar con la llave privada del oráculo
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // 4. Ejecutar retiro
        uint256 userBalanceBefore = user.balance;
        uint256 treasuryBalanceBefore = treasury.balance;

        vm.prank(user);
        escrow.withdraw(weekId, amountToReturn, deadline, signature);

        // 5. Verificaciones
        // Usuario recibe su parte
        assertEq(user.balance, userBalanceBefore + amountToReturn);
        // Tesorería recibe la multa
        assertEq(treasury.balance, treasuryBalanceBefore + penalty);
        // El depósito se borra (para evitar reentrancia/doble withdraw)
        assertEq(escrow.deposits(user, weekId), 0);
    }

    function testRevertWithdrawWithInvalidSigner() public {
        // Mismo setup, pero firmando con otra clave
        uint256 weekId = 1;
        vm.prank(user);
        escrow.deposit{value: 1 ether}(weekId);

        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 structHash = keccak256(abi.encode(
            SETTLEMENT_TYPEHASH,
            user,
            weekId,
            0.5 ether,
            deadline
        ));
        bytes32 domainSeparator = escrow.getDomainSeparator();
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);

        // FIRMA INVÁLIDA (Clave incorrecta)
        uint256 fakeKey = 0xB0B;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(fakeKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(user);
        
        // Esperamos que revierta con el error InvalidSignature()
        vm.expectRevert(HabitEscrow.InvalidSignature.selector);
        escrow.withdraw(weekId, 0.5 ether, deadline, signature);
    }
}
