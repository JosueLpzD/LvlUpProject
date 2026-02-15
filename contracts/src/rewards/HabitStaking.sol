// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HabitStaking
 * @author LvlUp Team
 * @notice Contrato principal del modelo Stake-to-Earn de LvlUp
 * 
 * Analogía: Es como un "gimnasio con depósito de compromiso".
 * - El usuario deposita tokens como apuesta de que cumplirá sus hábitos.
 * - Si cumple → recupera sus tokens + bonus del penalty pool.
 * - Si no cumple → pierde parte de sus tokens, que van al penalty pool.
 * - El penalty pool se reparte entre los que SÍ cumplieron.
 * 
 * Flujo:
 * 1. Usuario stakea tokens → tokens se bloquean en este contrato
 * 2. Backend reporta completación diaria de hábitos
 * 3. Al final del periodo, el usuario reclama:
 *    - Base: tokens proporcionales a los hábitos cumplidos
 *    - Bonus: una porción del penalty pool
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HabitStaking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ==================== Roles ====================
    // El backend tiene este rol para reportar hábitos completados
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    // ==================== Estado ====================
    
    // Token ERC-20 que se stakea
    IERC20 public immutable stakingToken;
    
    // Recompensa por hábito completado (en tokens, con 18 decimales)
    // Inicialmente: 1 token = 1 * 10^18
    uint256 public rewardPerHabit;
    
    // Pool de penalizaciones: tokens que perdieron los incumplidores
    // Se reparte como bonus entre los que sí cumplen
    uint256 public penaltyPool;
    
    // Duración de un ciclo de staking (en segundos)
    // Inicialmente: 7 días = 604800 segundos
    uint256 public stakeDuration;

    // ==================== Estructuras ====================
    
    // Información del stake de cada usuario
    struct StakeInfo {
        uint256 amount;           // Cantidad stakeada
        uint256 startTime;        // Cuándo empezó el stake
        uint256 endTime;          // Cuándo termina el ciclo
        uint256 habitsCompleted;  // Hábitos completados en este ciclo
        uint256 habitsRequired;   // Hábitos que se comprometió a hacer
        bool active;              // Si el stake está activo
        bool claimed;             // Si ya reclamó las recompensas
    }
    
    // Mapping: dirección del usuario → su información de stake
    mapping(address => StakeInfo) public stakes;

    // ==================== Eventos ====================
    event Staked(address indexed user, uint256 amount, uint256 habitsRequired, uint256 endTime);
    event HabitCompleted(address indexed user, uint256 habitNumber);
    event RewardsClaimed(address indexed user, uint256 baseReward, uint256 bonus);
    event PenaltyApplied(address indexed user, uint256 penaltyAmount);
    event RewardPerHabitUpdated(uint256 oldReward, uint256 newReward);
    event StakeDurationUpdated(uint256 oldDuration, uint256 newDuration);

    // ==================== Errores ====================
    error AlreadyStaking();
    error NotStaking();
    error StakePeriodNotEnded();
    error AlreadyClaimed();
    error InsufficientAmount();
    error ZeroHabits();
    error InvalidReward();

    /**
     * @notice Constructor: inicializa el contrato con el token y parámetros
     * @param _stakingToken Dirección del contrato LvlUpToken
     * @param _rewardPerHabit Recompensa por cada hábito (1 token = 1e18)
     * @param _stakeDuration Duración de un ciclo en segundos (7 días = 604800)
     */
    constructor(
        address _stakingToken,
        uint256 _rewardPerHabit,
        uint256 _stakeDuration
    ) {
        stakingToken = IERC20(_stakingToken);
        rewardPerHabit = _rewardPerHabit;
        stakeDuration = _stakeDuration;
        
        // El deployer es administrador
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // El deployer también puede reportar hábitos inicialmente
        _grantRole(REPORTER_ROLE, msg.sender);
    }

    // ==================== Funciones Principales ====================

    /**
     * @notice Stakear tokens y comprometerse a cumplir hábitos
     * @param amount Cantidad de tokens a stakear
     * @param habitsRequired Número de hábitos que se compromete a cumplir
     * 
     * Analogía: Es como hacer una apuesta contigo mismo.
     * "Voy a depositar 100 tokens y me comprometo a cumplir 5 hábitos esta semana"
     */
    function stake(uint256 amount, uint256 habitsRequired) external nonReentrant {
        // No puede stakear si ya tiene un stake activo
        if (stakes[msg.sender].active) revert AlreadyStaking();
        
        // Debe stakear al menos algo
        if (amount == 0) revert InsufficientAmount();
        
        // Debe comprometerse a al menos 1 hábito
        if (habitsRequired == 0) revert ZeroHabits();
        
        // Transferir tokens del usuario a este contrato (se "bloquean" aquí)
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Registrar el stake
        stakes[msg.sender] = StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            endTime: block.timestamp + stakeDuration,
            habitsCompleted: 0,
            habitsRequired: habitsRequired,
            active: true,
            claimed: false
        });
        
        emit Staked(msg.sender, amount, habitsRequired, block.timestamp + stakeDuration);
    }

    /**
     * @notice El backend reporta que un usuario completó un hábito
     * @param user Dirección del usuario que completó el hábito
     * 
     * Solo el backend (con REPORTER_ROLE) puede llamar esta función
     * 
     * Analogía: Es como el entrenador que marca asistencia en el gimnasio
     */
    function reportHabitCompleted(address user) external onlyRole(REPORTER_ROLE) {
        StakeInfo storage info = stakes[user];
        
        // El usuario debe tener un stake activo
        if (!info.active) revert NotStaking();
        
        // No puede exceder los hábitos comprometidos
        if (info.habitsCompleted < info.habitsRequired) {
            info.habitsCompleted += 1;
            emit HabitCompleted(user, info.habitsCompleted);
        }
    }

    /**
     * @notice Reclamar recompensas al final del ciclo
     * 
     * Calcula cuánto recibe el usuario basado en:
     * 1. Proporción de hábitos cumplidos → tokens base
     * 2. Bonus del penalty pool → tokens extra
     * 
     * Analogía: Es como cobrar el resultado de tu apuesta.
     * Si cumpliste todo → recuperas todo + bonus.
     * Si cumpliste a medias → pierdes la parte proporcional.
     */
    function claimRewards() external nonReentrant {
        StakeInfo storage info = stakes[msg.sender];
        
        // Verificaciones
        if (!info.active) revert NotStaking();
        if (info.claimed) revert AlreadyClaimed();
        if (block.timestamp < info.endTime) revert StakePeriodNotEnded();
        
        // Calcular proporción de hábitos cumplidos (ej: 3/5 = 60%)
        uint256 completionRate = (info.habitsCompleted * 1e18) / info.habitsRequired;
        
        // Base: tokens proporcionales a lo cumplido
        // Si stakeaste 100 y cumpliste 60% → recuperas 60 tokens
        uint256 baseReward = (info.amount * completionRate) / 1e18;
        
        // Penalización: lo que no cumplió va al penalty pool
        uint256 penalty = info.amount - baseReward;
        if (penalty > 0) {
            penaltyPool += penalty;
            emit PenaltyApplied(msg.sender, penalty);
        }
        
        // Bonus: porción del penalty pool (si cumplió al menos algo)
        uint256 bonus = 0;
        if (info.habitsCompleted > 0 && penaltyPool > 0) {
            // Bonus proporcional al completion rate
            // Quien cumplió más, recibe más bonus
            bonus = (penaltyPool * completionRate) / (10 * 1e18);
            
            // No dar más bonus del que hay disponible
            if (bonus > penaltyPool) {
                bonus = penaltyPool;
            }
            penaltyPool -= bonus;
        }
        
        // Total a devolver
        uint256 totalReward = baseReward + bonus;
        
        // Marcar como reclamado
        info.claimed = true;
        info.active = false;
        
        // Transferir tokens de vuelta al usuario
        if (totalReward > 0) {
            stakingToken.safeTransfer(msg.sender, totalReward);
        }
        
        emit RewardsClaimed(msg.sender, baseReward, bonus);
    }

    // ==================== Funciones de Vista ====================

    /**
     * @notice Ver información del stake de un usuario
     * @param user Dirección del usuario
     */
    function getStakeInfo(address user) external view returns (StakeInfo memory) {
        return stakes[user];
    }

    /**
     * @notice Calcular recompensa estimada (sin reclamar aún)
     * @param user Dirección del usuario
     */
    function estimateRewards(address user) external view returns (
        uint256 baseReward,
        uint256 estimatedBonus,
        uint256 penalty
    ) {
        StakeInfo memory info = stakes[user];
        
        if (!info.active || info.habitsRequired == 0) {
            return (0, 0, 0);
        }
        
        uint256 completionRate = (info.habitsCompleted * 1e18) / info.habitsRequired;
        baseReward = (info.amount * completionRate) / 1e18;
        penalty = info.amount - baseReward;
        
        if (info.habitsCompleted > 0 && penaltyPool > 0) {
            estimatedBonus = (penaltyPool * completionRate) / (10 * 1e18);
            if (estimatedBonus > penaltyPool) {
                estimatedBonus = penaltyPool;
            }
        }
    }

    // ==================== Funciones Admin ====================

    /**
     * @notice Actualizar recompensa por hábito
     * @param newReward Nueva cantidad de recompensa
     */
    function setRewardPerHabit(uint256 newReward) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newReward == 0) revert InvalidReward();
        uint256 old = rewardPerHabit;
        rewardPerHabit = newReward;
        emit RewardPerHabitUpdated(old, newReward);
    }

    /**
     * @notice Actualizar duración de un ciclo de staking
     * @param newDuration Nueva duración en segundos
     */
    function setStakeDuration(uint256 newDuration) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 old = stakeDuration;
        stakeDuration = newDuration;
        emit StakeDurationUpdated(old, newDuration);
    }
}
