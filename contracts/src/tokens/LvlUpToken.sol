// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LvlUpToken
 * @author LvlUp Team
 * @notice Token ERC-20 de recompensas para la plataforma LvlUp
 * 
 * Analogía: Es la "moneda" de la plataforma. Los usuarios la compran,
 * la stakean (bloquean como apuesta), y la recuperan + bonus al cumplir sus hábitos.
 * 
 * Características:
 * - ERC-20 estándar (transferible, visible en wallets)
 * - Minteo controlado por roles (solo el contrato de staking puede crear tokens)
 * - Quema de tokens (para penalizaciones)
 * - Supply cap configurable
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LvlUpToken is ERC20, ERC20Burnable, AccessControl {
    
    // Rol que permite crear (mintear) nuevos tokens
    // Solo el contrato HabitStaking tendrá este rol
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Supply máximo: 100 millones de tokens (con 18 decimales)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;

    // Evento cuando se mintean tokens nuevos
    event TokensMinted(address indexed to, uint256 amount);

    // Errores personalizados (más eficientes en gas que require + string)
    error MaxSupplyExceeded(uint256 requested, uint256 available);
    error ZeroAddress();
    error ZeroAmount();

    /**
     * @notice Constructor: Crea el token y asigna roles iniciales
     * @param initialSupply Cantidad inicial de tokens para el deployer (para liquidez)
     * 
     * Analogía: Es como abrir un banco y decidir cuánto dinero imprimir inicialmente
     */
    constructor(uint256 initialSupply) ERC20("LvlUp", "LVLUP") {
        // El deployer obtiene el rol de administrador
        // Puede dar/quitar roles a otros contratos
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // El deployer también puede mintear inicialmente
        _grantRole(MINTER_ROLE, msg.sender);
        
        // Mintear supply inicial (si se proporcionó alguno)
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }

    /**
     * @notice Crear nuevos tokens y enviarlos a una dirección
     * @param to Dirección que recibirá los tokens
     * @param amount Cantidad de tokens a crear
     * 
     * Solo puede llamar quien tenga MINTER_ROLE (el contrato HabitStaking)
     * 
     * Analogía: Es como el banco central imprimiendo dinero nuevo,
     * pero solo cuando alguien cumplió sus hábitos y merece un bonus
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        // Verificar que la dirección destino sea válida
        if (to == address(0)) revert ZeroAddress();
        
        // Verificar que la cantidad sea mayor a cero
        if (amount == 0) revert ZeroAmount();
        
        // Verificar que no exceda el supply máximo
        uint256 available = MAX_SUPPLY - totalSupply();
        if (amount > available) revert MaxSupplyExceeded(amount, available);
        
        // Crear los tokens
        _mint(to, amount);
        
        // Emitir evento para tracking
        emit TokensMinted(to, amount);
    }

    /**
     * @notice Consultar cuántos tokens se pueden crear aún
     * @return Cantidad de tokens disponibles para mintear
     */
    function mintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
}
