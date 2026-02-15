// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HabitStaking Test
 * @notice Tests para el contrato Stake-to-Earn de LvlUp
 * 
 * Estructura de los tests:
 * 1. Deploy y estado inicial
 * 2. Stakear tokens (casos válidos e inválidos)
 * 3. Reportar hábitos completados
 * 4. Reclamar recompensas (100%, parcial, 0%)
 * 5. Penalty pool y bonus
 * 6. Funciones admin
 * 7. Fuzz testing
 * 
 * Analogía: Cada test es como un "escenario de la vida real":
 * - test_Stake → "Un usuario se inscribe al gimnasio y paga"
 * - test_ClaimFullCompletion → "Fue todos los días y cobra completo"
 * - test_ClaimPartialCompletion → "Faltó algunos días y pierde la apuesta"
 */

import {Test, console} from "forge-std/Test.sol";
import {LvlUpToken} from "../src/tokens/LvlUpToken.sol";
import {HabitStaking} from "../src/rewards/HabitStaking.sol";

contract HabitStakingTest is Test {
    // Contratos
    LvlUpToken public token;
    HabitStaking public staking;

    // Direcciones de prueba
    address public deployer = address(this);
    address public alice = makeAddr("alice");     // Usuario que cumple TODO
    address public bob = makeAddr("bob");         // Usuario que cumple PARCIAL
    address public charlie = makeAddr("charlie"); // Usuario que NO cumple
    address public reporter = makeAddr("reporter"); // Backend que reporta hábitos

    // Constantes
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18;
    uint256 public constant REWARD_PER_HABIT = 1 * 10**18;  // 1 token
    uint256 public constant STAKE_DURATION = 7 days;
    uint256 public constant STAKE_AMOUNT = 100 * 10**18;    // 100 tokens

    // ==================== setUp ====================
    function setUp() public {
        // 1. Desplegar token con supply inicial
        token = new LvlUpToken(INITIAL_SUPPLY);

        // 2. Desplegar staking con parámetros
        staking = new HabitStaking(
            address(token),
            REWARD_PER_HABIT,
            STAKE_DURATION
        );

        // 3. Dar REPORTER_ROLE al reporter
        staking.grantRole(staking.REPORTER_ROLE(), reporter);

        // 4. Repartir tokens a los usuarios de prueba
        token.transfer(alice, STAKE_AMOUNT * 2);    // 200 tokens
        token.transfer(bob, STAKE_AMOUNT * 2);      // 200 tokens
        token.transfer(charlie, STAKE_AMOUNT * 2);  // 200 tokens
    }

    // ==================== Helpers ====================

    /// @notice Helper: Alice stakea con parámetros por defecto
    function _aliceStakes(uint256 amount, uint256 habits) internal {
        vm.startPrank(alice);
        token.approve(address(staking), amount);
        staking.stake(amount, habits);
        vm.stopPrank();
    }

    /// @notice Helper: Avanzar el tiempo al final del periodo de staking
    function _skipToEndOfStake() internal {
        vm.warp(block.timestamp + STAKE_DURATION + 1);
    }

    /// @notice Helper: Reporter reporta N hábitos para un usuario
    function _reportHabits(address user, uint256 count) internal {
        vm.startPrank(reporter);
        for (uint256 i = 0; i < count; i++) {
            staking.reportHabitCompleted(user);
        }
        vm.stopPrank();
    }

    // ==================== Tests de Deploy ====================

    /// @notice Verificar estado inicial del contrato
    function test_InitialState() public view {
        assertEq(address(staking.stakingToken()), address(token));
        assertEq(staking.rewardPerHabit(), REWARD_PER_HABIT);
        assertEq(staking.stakeDuration(), STAKE_DURATION);
        assertEq(staking.penaltyPool(), 0);
    }

    /// @notice Verificar roles iniciales
    function test_InitialRoles() public view {
        assertTrue(staking.hasRole(staking.DEFAULT_ADMIN_ROLE(), deployer));
        assertTrue(staking.hasRole(staking.REPORTER_ROLE(), deployer));
        assertTrue(staking.hasRole(staking.REPORTER_ROLE(), reporter));
    }

    // ==================== Tests de Stake ====================

    /// @notice Stakear tokens correctamente
    function test_Stake() public {
        _aliceStakes(STAKE_AMOUNT, 5);

        // Verificar que los tokens se transfirieron al contrato
        assertEq(token.balanceOf(address(staking)), STAKE_AMOUNT);
        assertEq(token.balanceOf(alice), STAKE_AMOUNT);  // Tenía 200, stakeó 100

        // Verificar la info del stake
        HabitStaking.StakeInfo memory info = staking.getStakeInfo(alice);
        assertEq(info.amount, STAKE_AMOUNT);
        assertEq(info.habitsRequired, 5);
        assertEq(info.habitsCompleted, 0);
        assertTrue(info.active);
        assertFalse(info.claimed);
    }

    /// @notice No se puede stakear con cantidad 0
    function test_RevertWhen_StakeZeroAmount() public {
        vm.startPrank(alice);
        token.approve(address(staking), 1000);
        vm.expectRevert(HabitStaking.InsufficientAmount.selector);
        staking.stake(0, 5);
        vm.stopPrank();
    }

    /// @notice No se puede stakear con 0 hábitos
    function test_RevertWhen_StakeZeroHabits() public {
        vm.startPrank(alice);
        token.approve(address(staking), STAKE_AMOUNT);
        vm.expectRevert(HabitStaking.ZeroHabits.selector);
        staking.stake(STAKE_AMOUNT, 0);
        vm.stopPrank();
    }

    /// @notice No se puede stakear dos veces
    function test_RevertWhen_DoubleStake() public {
        _aliceStakes(STAKE_AMOUNT, 5);

        vm.startPrank(alice);
        token.approve(address(staking), STAKE_AMOUNT);
        vm.expectRevert(HabitStaking.AlreadyStaking.selector);
        staking.stake(STAKE_AMOUNT, 5);
        vm.stopPrank();
    }

    /// @notice Emit evento Staked al stakear
    function test_StakeEmitsEvent() public {
        vm.startPrank(alice);
        token.approve(address(staking), STAKE_AMOUNT);

        vm.expectEmit(true, false, false, true);
        emit HabitStaking.Staked(alice, STAKE_AMOUNT, 5, block.timestamp + STAKE_DURATION);

        staking.stake(STAKE_AMOUNT, 5);
        vm.stopPrank();
    }

    // ==================== Tests de Reportar Hábitos ====================

    /// @notice Reporter puede reportar hábitos
    function test_ReportHabit() public {
        _aliceStakes(STAKE_AMOUNT, 5);
        _reportHabits(alice, 1);

        HabitStaking.StakeInfo memory info = staking.getStakeInfo(alice);
        assertEq(info.habitsCompleted, 1);
    }

    /// @notice Reportar múltiples hábitos
    function test_ReportMultipleHabits() public {
        _aliceStakes(STAKE_AMOUNT, 5);
        _reportHabits(alice, 3);

        HabitStaking.StakeInfo memory info = staking.getStakeInfo(alice);
        assertEq(info.habitsCompleted, 3);
    }

    /// @notice No puede exceder el máximo de hábitos comprometidos
    function test_CannotExceedHabitsRequired() public {
        _aliceStakes(STAKE_AMOUNT, 3);
        _reportHabits(alice, 5);  // Reportar 5 pero solo se comprometió a 3

        HabitStaking.StakeInfo memory info = staking.getStakeInfo(alice);
        assertEq(info.habitsCompleted, 3);  // Se detiene en 3
    }

    /// @notice Un usuario sin REPORTER_ROLE no puede reportar
    function test_RevertWhen_NonReporterReports() public {
        _aliceStakes(STAKE_AMOUNT, 5);

        vm.prank(alice);
        vm.expectRevert();
        staking.reportHabitCompleted(alice);
    }

    /// @notice No se puede reportar para un usuario sin stake
    function test_RevertWhen_ReportForNonStaker() public {
        vm.prank(reporter);
        vm.expectRevert(HabitStaking.NotStaking.selector);
        staking.reportHabitCompleted(alice);
    }

    // ==================== Tests de Claim: 100% Completado ====================

    /// @notice Cumplir 100% de hábitos → recuperar todos los tokens
    function test_ClaimFullCompletion() public {
        _aliceStakes(STAKE_AMOUNT, 5);
        _reportHabits(alice, 5);  // Cumplió todos
        _skipToEndOfStake();

        uint256 balanceBefore = token.balanceOf(alice);

        vm.prank(alice);
        staking.claimRewards();

        // Recupera todo su stake (100%)
        uint256 balanceAfter = token.balanceOf(alice);
        assertEq(balanceAfter - balanceBefore, STAKE_AMOUNT);

        // Verificar estado
        HabitStaking.StakeInfo memory info = staking.getStakeInfo(alice);
        assertTrue(info.claimed);
        assertFalse(info.active);
    }

    // ==================== Tests de Claim: Parcial ====================

    /// @notice Cumplir 3/5 hábitos → recuperar 60%, perder 40%
    function test_ClaimPartialCompletion() public {
        _aliceStakes(STAKE_AMOUNT, 5);
        _reportHabits(alice, 3);  // Cumplió 3 de 5 = 60%
        _skipToEndOfStake();

        uint256 balanceBefore = token.balanceOf(alice);

        vm.prank(alice);
        staking.claimRewards();

        // Base reward: 100 * 60% = 60 tokens
        // Penalty: 40 tokens van al pool
        // Bonus: del penalty pool (40 * 60%) / 10 = 2.4 tokens
        uint256 balanceAfter = token.balanceOf(alice);
        uint256 received = balanceAfter - balanceBefore;

        // Base = 60 tokens, bonus ≈ 2.4 tokens → total ≈ 62.4 tokens
        assertGt(received, 60 * 10**18);  // Más de 60 por el bonus
        assertLt(received, STAKE_AMOUNT);  // Menos de 100 (perdió algo)

        // El penalty pool debería tener los tokens restantes
        uint256 expectedPenalty = 40 * 10**18;  // 40% de penalización
        uint256 expectedBonus = (expectedPenalty * 60 * 10**16) / (10 * 10**18);  // bonus
        assertEq(staking.penaltyPool(), expectedPenalty - expectedBonus);
    }

    // ==================== Tests de Claim: 0% completado ====================

    /// @notice No cumplir nada → perder todos los tokens
    function test_ClaimZeroCompletion() public {
        _aliceStakes(STAKE_AMOUNT, 5);
        // No reportar ningún hábito
        _skipToEndOfStake();

        uint256 balanceBefore = token.balanceOf(alice);

        vm.prank(alice);
        staking.claimRewards();

        // No recupera nada (0% completion)
        uint256 balanceAfter = token.balanceOf(alice);
        assertEq(balanceAfter, balanceBefore);

        // Todos los tokens van al penalty pool
        assertEq(staking.penaltyPool(), STAKE_AMOUNT);
    }

    // ==================== Tests de Claim: Validaciones ====================

    /// @notice No puede reclamar antes de que termine el periodo
    function test_RevertWhen_ClaimBeforeEnd() public {
        _aliceStakes(STAKE_AMOUNT, 5);
        _reportHabits(alice, 5);

        // NO avanzar el tiempo
        vm.prank(alice);
        vm.expectRevert(HabitStaking.StakePeriodNotEnded.selector);
        staking.claimRewards();
    }

    /// @notice No puede reclamar dos veces
    function test_RevertWhen_DoubleClaim() public {
        _aliceStakes(STAKE_AMOUNT, 5);
        _reportHabits(alice, 5);
        _skipToEndOfStake();

        vm.startPrank(alice);
        staking.claimRewards();

        vm.expectRevert(HabitStaking.NotStaking.selector);
        staking.claimRewards();
        vm.stopPrank();
    }

    /// @notice No puede reclamar sin stake activo
    function test_RevertWhen_ClaimWithoutStake() public {
        vm.prank(alice);
        vm.expectRevert(HabitStaking.NotStaking.selector);
        staking.claimRewards();
    }

    // ==================== Test de Penalty Pool: Escenario Completo ====================

    /// @notice Escenario: Bob pierde, Alice se beneficia
    /// Bob stakea y no cumple → penalty pool crece
    /// Alice stakea y cumple 100% → recibe bonus del pool
    function test_PenaltyPoolRedistribution() public {
        // Bob stakea 100 tokens, 5 hábitos, NO cumple ninguno
        vm.startPrank(bob);
        token.approve(address(staking), STAKE_AMOUNT);
        staking.stake(STAKE_AMOUNT, 5);
        vm.stopPrank();

        _skipToEndOfStake();

        // Bob reclama → pierde todo, va al penalty pool
        vm.prank(bob);
        staking.claimRewards();

        assertEq(staking.penaltyPool(), STAKE_AMOUNT);  // 100 tokens en el pool

        // Alice stakea 100 tokens, 5 hábitos, cumple TODOS
        vm.warp(block.timestamp + 1);  // Avanzar 1 segundo para nuevo timestamp
        _aliceStakes(STAKE_AMOUNT, 5);
        _reportHabits(alice, 5);

        vm.warp(block.timestamp + STAKE_DURATION + 1);

        uint256 aliceBefore = token.balanceOf(alice);

        vm.prank(alice);
        staking.claimRewards();

        uint256 aliceAfter = token.balanceOf(alice);
        uint256 received = aliceAfter - aliceBefore;

        // Alice recupera sus 100 + bonus del penalty pool
        assertGt(received, STAKE_AMOUNT);  // Más de lo que stakeó

        console.log("Alice staked:", STAKE_AMOUNT / 10**18, "tokens");
        console.log("Alice received:", received / 10**18, "tokens");
        console.log("Alice bonus:", (received - STAKE_AMOUNT) / 10**18, "tokens");
    }

    // ==================== Tests de Estimate ====================

    /// @notice Estimar recompensas antes de reclamar
    function test_EstimateRewards() public {
        _aliceStakes(STAKE_AMOUNT, 5);
        _reportHabits(alice, 3);

        (uint256 base, , uint256 penalty) = staking.estimateRewards(alice);

        // 3/5 = 60% → base = 60 tokens, penalty = 40 tokens
        assertEq(base, 60 * 10**18);
        assertEq(penalty, 40 * 10**18);
    }

    /// @notice Estimar retorna 0 para usuario sin stake
    function test_EstimateRewardsNoStake() public view {
        (uint256 base, uint256 bonus, uint256 penalty) = staking.estimateRewards(alice);
        assertEq(base, 0);
        assertEq(bonus, 0);
        assertEq(penalty, 0);
    }

    // ==================== Tests Admin ====================

    /// @notice Admin puede cambiar reward per habit
    function test_SetRewardPerHabit() public {
        uint256 newReward = 5 * 10**18;
        staking.setRewardPerHabit(newReward);
        assertEq(staking.rewardPerHabit(), newReward);
    }

    /// @notice No se puede poner reward a 0
    function test_RevertWhen_SetZeroReward() public {
        vm.expectRevert(HabitStaking.InvalidReward.selector);
        staking.setRewardPerHabit(0);
    }

    /// @notice Admin puede cambiar la duración del stake
    function test_SetStakeDuration() public {
        uint256 newDuration = 14 days;
        staking.setStakeDuration(newDuration);
        assertEq(staking.stakeDuration(), newDuration);
    }

    /// @notice Un usuario sin admin no puede cambiar parámetros
    function test_RevertWhen_NonAdminSetsReward() public {
        vm.prank(alice);
        vm.expectRevert();
        staking.setRewardPerHabit(5 * 10**18);
    }

    // ==================== Fuzz Tests ====================

    /// @notice Fuzz: cualquier cantidad de stake válida funciona
    function testFuzz_Stake(uint256 amount, uint256 habits) public {
        // Limitar a valores razonables
        amount = bound(amount, 1, STAKE_AMOUNT * 2);
        habits = bound(habits, 1, 100);

        vm.startPrank(alice);
        token.approve(address(staking), amount);
        staking.stake(amount, habits);
        vm.stopPrank();

        HabitStaking.StakeInfo memory info = staking.getStakeInfo(alice);
        assertEq(info.amount, amount);
        assertEq(info.habitsRequired, habits);
    }

    /// @notice Fuzz: completion parcial siempre devuelve <= staked
    function testFuzz_ClaimNeverExceedsStakeWithoutBonus(uint256 habits, uint256 completed) public {
        habits = bound(habits, 1, 50);
        completed = bound(completed, 0, habits);

        _aliceStakes(STAKE_AMOUNT, habits);

        // Reportar hábitos
        vm.startPrank(reporter);
        for (uint256 i = 0; i < completed; i++) {
            staking.reportHabitCompleted(alice);
        }
        vm.stopPrank();

        _skipToEndOfStake();

        uint256 balanceBefore = token.balanceOf(alice);

        vm.prank(alice);
        staking.claimRewards();

        uint256 received = token.balanceOf(alice) - balanceBefore;

        // Sin penalty pool previo, nunca recibe más de lo que stakeó
        assertLe(received, STAKE_AMOUNT);
    }
}
