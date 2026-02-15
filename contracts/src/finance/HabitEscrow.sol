// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HabitEscrow
 * @notice Bóveda de compromisos para hábitos.
 * @dev Usa EIP-712 para permitir liquidación off-chain (gasless settlement verification).
 *      El backend (Oráculo) firma un mensaje autorizando el retiro ajustado por penalizaciones.
 */
contract HabitEscrow is EIP712, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // --- State Variables ---
    address public oracleSigner; // La dirección del backend que firma los resultados
    address public treasury;     // Donde van las penalizaciones

    // Mapping de depósitos activos: user -> weekId -> amount
    mapping(address => mapping(uint256 => uint256)) public deposits;
    
    // Mapping para evitar replay attacks: signature digest -> used
    mapping(bytes32 => bool) public isSignatureUsed;

    // --- Events ---
    event Deposited(address indexed user, uint256 indexed weekId, uint256 amount);
    event Withdrawn(address indexed user, uint256 indexed weekId, uint256 amountReturned, uint256 penalty);
    event OracleUpdated(address indexed newOracle);
    event TreasuryUpdated(address indexed newTreasury);

    // --- Errors ---
    error InvalidSignature();
    error SignatureExpired();
    error SignatureUsed();
    error NoDepositFound();
    error TransferFailed();
    error InvalidAmount();

    // --- EIP-712 TypeHash ---
    // struct Settlement { address user; uint256 weekId; uint256 amountToReturn; uint256 deadline; }
    bytes32 private constant SETTLEMENT_TYPEHASH = 
        keccak256("Settlement(address user,uint256 weekId,uint256 amountToReturn,uint256 deadline)");

    constructor(address _oracleSigner, address _treasury) 
        EIP712("HabitEscrow", "1") 
        Ownable(msg.sender) 
    {
        oracleSigner = _oracleSigner;
        treasury = _treasury;
    }

    // --- User Actions ---

    /**
     * @notice Deposita ETH para comprometerse a una semana de hábitos.
     * @param weekId Identificador de la semana (ej. timestamp / 1 weeks o ID incremental del backend).
     */
    function deposit(uint256 weekId) external payable nonReentrant {
        if (msg.value == 0) revert InvalidAmount();
        
        // Sumar al depósito existente (permite "top-up" si el usuario quiere apostar más a mitad de semana)
        deposits[msg.sender][weekId] += msg.value;

        emit Deposited(msg.sender, weekId, msg.value);
    }

    /**
     * @notice Liquida el compromiso y retira los fondos restantes.
     * @dev Requiere una firma válida del Oráculo.
     * @param weekId ID de la semana a liquidar.
     * @param amountToReturn Monto que el usuario recibe de vuelta (lo que sobró tras penalizaciones).
     * @param deadline Timestamp de expiración de la firma.
     * @param signature Firma EIP-712 del Oráculo.
     */
    function withdraw(
        uint256 weekId, 
        uint256 amountToReturn, 
        uint256 deadline, 
        bytes calldata signature
    ) external nonReentrant {
        if (block.timestamp > deadline) revert SignatureExpired();
        
        uint256 totalDeposited = deposits[msg.sender][weekId];
        if (totalDeposited == 0) revert NoDepositFound();
        if (amountToReturn > totalDeposited) revert InvalidAmount(); // No podemos devolver más de lo depositado

        // 1. Verificar Firma
        bytes32 structHash = keccak256(abi.encode(
            SETTLEMENT_TYPEHASH,
            msg.sender,
            weekId,
            amountToReturn,
            deadline
        ));

        bytes32 digest = _hashTypedDataV4(structHash);
        
        if (isSignatureUsed[digest]) revert SignatureUsed();
        
        address signer = ECDSA.recover(digest, signature);
        if (signer != oracleSigner) revert InvalidSignature();

        // 2. Marcar firma como usada y limpiar depósito (efecto)
        isSignatureUsed[digest] = true;
        delete deposits[msg.sender][weekId]; // Borramos el depósito para evitar reentrancia/doble gasto lógico

        // 3. Transferencias (Interacción)
        
        // A. Devolver al usuario
        if (amountToReturn > 0) {
            (bool successUser, ) = payable(msg.sender).call{value: amountToReturn}("");
            if (!successUser) revert TransferFailed();
        }

        // B. Enviar penalización a tesorería (si hubo)
        uint256 penalty = totalDeposited - amountToReturn;
        if (penalty > 0) {
            (bool successTreasury, ) = payable(treasury).call{value: penalty}("");
            if (!successTreasury) revert TransferFailed();
        }

        emit Withdrawn(msg.sender, weekId, amountToReturn, penalty);
    }

    // --- Admin Functions ---

    function setOracleSigner(address _newOracle) external onlyOwner {
        oracleSigner = _newOracle;
        emit OracleUpdated(_newOracle);
    }

    function setTreasury(address _newTreasury) external onlyOwner {
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    // Permitir al contrato recibir ETH (aunque deposit debería ser la vía principal)
    receive() external payable {}

    /**
     * @notice Retorna el Domain Separator para generar firmas compatibles en el frontend/backend.
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
