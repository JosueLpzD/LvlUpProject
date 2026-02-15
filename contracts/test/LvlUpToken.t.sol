// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LvlUpToken Test
 * @notice Tests para el token ERC-20 de LvlUp
 * 
 * Estructura de los tests:
 * 1. Deploy y estado inicial
 * 2. Mint (crear tokens) - permisos y límites
 * 3. Burn (quemar tokens)
 * 4. Roles de acceso (AccessControl)
 * 5. Fuzz testing (valores aleatorios)
 */

import {Test, console} from "forge-std/Test.sol";
import {LvlUpToken} from "../src/tokens/LvlUpToken.sol";

contract LvlUpTokenTest is Test {
    // Instancia del contrato a testear
    LvlUpToken public token;

    // Direcciones de prueba
    address public deployer = address(this);  // Este contrato de test es el deployer
    address public alice = address(0xA11CE);  // Usuario normal
    address public bob = address(0xB0B);      // Otro usuario normal
    address public minter = address(0xC0DE);  // Un minter autorizado

    // Constantes de prueba
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18;  // 1 millón de tokens

    // ==================== setUp ====================
    // Se ejecuta ANTES de cada test individual
    // Analogía: Es como preparar la mesa antes de cada comida
    function setUp() public {
        // Desplegar token con 1M de supply inicial
        token = new LvlUpToken(INITIAL_SUPPLY);
    }

    // ==================== Tests de Deploy ====================

    /// @notice Verificar que el nombre del token sea correcto
    function test_Name() public view {
        assertEq(token.name(), "LvlUp");
    }

    /// @notice Verificar que el símbolo del token sea correcto
    function test_Symbol() public view {
        assertEq(token.symbol(), "LVLUP");
    }

    /// @notice Verificar que el supply inicial se asignó al deployer
    function test_InitialSupply() public view {
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(deployer), INITIAL_SUPPLY);
    }

    /// @notice Verificar que se puede desplegar sin supply inicial
    function test_DeployWithZeroSupply() public {
        LvlUpToken zeroToken = new LvlUpToken(0);
        assertEq(zeroToken.totalSupply(), 0);
    }

    /// @notice Verificar que el MAX_SUPPLY es 100M
    function test_MaxSupply() public view {
        assertEq(token.MAX_SUPPLY(), 100_000_000 * 10**18);
    }

    /// @notice Verificar que mintableSupply es correcto después del deploy
    function test_MintableSupply() public view {
        // 100M - 1M = 99M disponibles para mintear
        assertEq(token.mintableSupply(), 99_000_000 * 10**18);
    }

    // ==================== Tests de Roles ====================

    /// @notice El deployer tiene DEFAULT_ADMIN_ROLE
    function test_DeployerHasAdminRole() public view {
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), deployer));
    }

    /// @notice El deployer tiene MINTER_ROLE
    function test_DeployerHasMinterRole() public view {
        assertTrue(token.hasRole(token.MINTER_ROLE(), deployer));
    }

    /// @notice Un usuario normal NO tiene MINTER_ROLE
    function test_UserDoesNotHaveMinterRole() public view {
        assertFalse(token.hasRole(token.MINTER_ROLE(), alice));
    }

    /// @notice El admin puede otorgar MINTER_ROLE a otra dirección
    function test_AdminCanGrantMinterRole() public {
        token.grantRole(token.MINTER_ROLE(), minter);
        assertTrue(token.hasRole(token.MINTER_ROLE(), minter));
    }

    // ==================== Tests de Mint ====================

    /// @notice El minter puede crear tokens
    function test_MintTokens() public {
        uint256 mintAmount = 1000 * 10**18;
        token.mint(alice, mintAmount);

        assertEq(token.balanceOf(alice), mintAmount);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + mintAmount);
    }

    /// @notice Un usuario sin MINTER_ROLE NO puede mintear
    function test_RevertWhen_NonMinterMints() public {
        // Alice intenta mintear (no tiene MINTER_ROLE)
        vm.prank(alice);
        vm.expectRevert();
        token.mint(alice, 1000);
    }

    /// @notice No se puede mintear a la dirección cero
    function test_RevertWhen_MintToZeroAddress() public {
        vm.expectRevert(LvlUpToken.ZeroAddress.selector);
        token.mint(address(0), 1000);
    }

    /// @notice No se puede mintear cantidad cero
    function test_RevertWhen_MintZeroAmount() public {
        vm.expectRevert(LvlUpToken.ZeroAmount.selector);
        token.mint(alice, 0);
    }

    /// @notice No se puede exceder el MAX_SUPPLY
    function test_RevertWhen_MintExceedsMaxSupply() public {
        // Intentar mintear más del supply disponible (99M + 1)
        uint256 available = token.mintableSupply();
        vm.expectRevert(
            abi.encodeWithSelector(
                LvlUpToken.MaxSupplyExceeded.selector,
                available + 1,
                available
            )
        );
        token.mint(alice, available + 1);
    }

    /// @notice Se puede mintear exactamente hasta el MAX_SUPPLY
    function test_MintExactlyToMaxSupply() public {
        uint256 available = token.mintableSupply();
        token.mint(alice, available);

        assertEq(token.totalSupply(), token.MAX_SUPPLY());
        assertEq(token.mintableSupply(), 0);
    }

    // ==================== Tests de Burn ====================

    /// @notice Un usuario puede quemar sus propios tokens
    function test_BurnTokens() public {
        // Dar tokens a Alice y luego quemar
        token.transfer(alice, 500 * 10**18);

        vm.prank(alice);
        token.burn(200 * 10**18);

        assertEq(token.balanceOf(alice), 300 * 10**18);
    }

    // ==================== Tests de Transfer ====================

    /// @notice Transferencia básica funciona
    function test_Transfer() public {
        token.transfer(alice, 100 * 10**18);
        assertEq(token.balanceOf(alice), 100 * 10**18);
    }

    /// @notice No se puede transferir más de lo que se tiene
    function test_RevertWhen_TransferExceedsBalance() public {
        vm.prank(alice);
        vm.expectRevert();
        token.transfer(bob, 1);  // Alice no tiene tokens
    }

    // ==================== Tests de Eventos ====================

    /// @notice Mint emite evento TokensMinted
    function test_MintEmitsEvent() public {
        uint256 amount = 500 * 10**18;

        vm.expectEmit(true, false, false, true);
        emit LvlUpToken.TokensMinted(alice, amount);

        token.mint(alice, amount);
    }

    // ==================== Fuzz Tests ====================

    /// @notice Fuzz: cualquier cantidad válida de mint funciona
    function testFuzz_Mint(uint256 amount) public {
        // Limitar al supply disponible (para que no revierte)
        amount = bound(amount, 1, token.mintableSupply());

        token.mint(alice, amount);
        assertEq(token.balanceOf(alice), amount);
    }

    /// @notice Fuzz: cualquier transferencia válida funciona
    function testFuzz_Transfer(uint256 amount) public {
        amount = bound(amount, 1, INITIAL_SUPPLY);

        uint256 deployerBefore = token.balanceOf(deployer);
        token.transfer(alice, amount);

        assertEq(token.balanceOf(deployer), deployerBefore - amount);
        assertEq(token.balanceOf(alice), amount);
    }
}
