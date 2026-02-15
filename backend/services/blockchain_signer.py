"""
Blockchain Signer Service

Este módulo genera firmas criptográficas para validar recompensas en blockchain.

Funcionamiento:
1. El backend verifica que el usuario completó una tarea
2. Genera una firma única usando la clave privada del backend
3. El usuario presenta esta firma al smart contract
4. El contrato verifica la firma antes de dar la recompensa

Analogía: Es como un notario que firma documentos oficiales.
Solo el backend puede crear firmas válidas porque solo él tiene la clave privada.
"""

from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3
import os
from typing import Dict
import time


class BlockchainSigner:
    """
    Servicio para firmar mensajes relacionados con recompensas blockchain
    """
    
    def __init__(self):
        """
        Inicializa el servicio cargando la clave privada del .env
        """
        # Cargar clave privada desde variable de entorno
        private_key = os.getenv("SIGNER_PRIVATE_KEY")
        
        if not private_key:
            raise ValueError(
                "❌ SIGNER_PRIVATE_KEY no encontrada en .env\n"
                "Genera una con: python -c \"from eth_account import Account; print(Account.create().key.hex())\""
            )
        
        # Crear cuenta desde la clave privada
        self.account = Account.from_key(private_key)
        
        # Dirección pública del firmante (backend)
        self.signer_address = self.account.address
        
        print(f"✅ BlockchainSigner inicializado. Dirección: {self.signer_address}")
    
    def generate_claim_signature(
        self, 
        user_address: str, 
        reward_amount: int,
        task_id: str
    ) -> Dict[str, str]:
        """
        Genera una firma para que el usuario pueda reclamar recompensas
        
        Args:
            user_address: Dirección de wallet del usuario (ej: "0x123...")
            reward_amount: Cantidad de tokens a recompensar (en unidades enteras)
            task_id: ID de la tarea completada (para evitar reclamos duplicados)
        
        Returns:
            Diccionario con la firma y datos necesarios
        
        Ejemplo:
            >>> signer = BlockchainSigner()
            >>> signature = signer.generate_claim_signature(
            ...     user_address="0xABC...",
            ...     reward_amount=100,
            ...     task_id="task_12345"
            ... )
            >>> print(signature["signature"])
            "0x1234abcd..."
        """
        
        # Validar que la dirección sea válida
        if not Web3.is_address(user_address):
            raise ValueError(f"❌ Dirección inválida: {user_address}")
        
        # Normalizar dirección a checksum (formato correcto de Ethereum)
        user_address = Web3.to_checksum_address(user_address)
        
        # Timestamp actual (para evitar que firmas viejas se reutilicen)
        timestamp = int(time.time())
        
        # Crear el mensaje que vamos a firmar
        # Este mensaje debe coincidir EXACTAMENTE con el que verifica el contrato
        message = Web3.solidity_keccak(
            ['address', 'uint256', 'string', 'uint256'],
            [user_address, reward_amount, task_id, timestamp]
        )
        
        # Convertir el hash a formato de mensaje de Ethereum
        signable_message = encode_defunct(message)
        
        # Firmar el mensaje con la clave privada del backend
        signed_message = self.account.sign_message(signable_message)
        
        # Retornar todos los datos necesarios para el claim
        return {
            "signature": signed_message.signature.hex(),  # Firma en hexadecimal
            "user_address": user_address,                 # Dirección del usuario
            "reward_amount": reward_amount,               # Cantidad a reclamar
            "task_id": task_id,                           # ID de la tarea
            "timestamp": timestamp,                       # Cuando se generó
            "signer_address": self.signer_address         # Quien firmó (backend)
        }
    
    def verify_signature(
        self,
        signature: str,
        user_address: str,
        reward_amount: int,
        task_id: str,
        timestamp: int
    ) -> bool:
        """
        Verifica que una firma sea válida (útil para testing)
        
        Args:
            signature: Firma a verificar
            user_address: Dirección del usuario
            reward_amount: Cantidad de recompensa
            task_id: ID de la tarea
            timestamp: Timestamp de la firma original
        
        Returns:
            True si la firma es válida, False si no
        """
        
        # Recrear el mensaje original
        message = Web3.solidity_keccak(
            ['address', 'uint256', 'string', 'uint256'],
            [Web3.to_checksum_address(user_address), reward_amount, task_id, timestamp]
        )
        
        signable_message = encode_defunct(message)
        
        # Recuperar la dirección que firmó el mensaje
        recovered_address = Account.recover_message(
            signable_message, 
            signature=signature
        )
        
        # Verificar que la dirección recuperada sea la del backend
        return recovered_address.lower() == self.signer_address.lower()


    
    def generate_settlement_signature(
        self,
        user_address: str,
        week_id: int,
        amount_to_return: int,
        deadline: int,
        contract_address: str,
        chain_id: int = 84532
    ) -> str:
        """
        Genera una firma EIP-712 para liquidar compromisos de hábitos.
        
        Struct en Solidity:
        struct Settlement {
            address user;
            uint256 weekId;
            uint256 amountToReturn;
            uint256 deadline;
        }
        """
        
        # 1. Definir el Domain Separator
        domain_data = {
            "name": "HabitEscrow",
            "version": "1",
            "chainId": chain_id,
            "verifyingContract": Web3.to_checksum_address(contract_address)
        }
        
        # 2. Definir los Tipos (EIP-712)
        message_types = {
            "Settlement": [
                {"name": "user", "type": "address"},
                {"name": "weekId", "type": "uint256"},
                {"name": "amountToReturn", "type": "uint256"},
                {"name": "deadline", "type": "uint256"}
            ]
        }
        
        # 3. Definir los Datos del Mensaje
        message_data = {
            "user": Web3.to_checksum_address(user_address),
            "weekId": week_id,
            "amountToReturn": amount_to_return,
            "deadline": deadline
        }
        
        # 4. Firmar usando sign_typed_data
        signed_message = self.account.sign_typed_data(
            domain_data=domain_data,
            message_types=message_types,
            message_data=message_data
        )
        
        return signed_message.signature.hex()


# Crear instancia global del servicio
# Se inicializa una sola vez cuando el servidor arranca
signer_service = BlockchainSigner()
