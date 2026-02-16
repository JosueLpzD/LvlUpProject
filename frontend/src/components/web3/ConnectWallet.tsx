'use client'

/**
 * ConnectWallet - Botón para conectar wallet usando OnchainKit
 * 
 * Características:
 * - Detección automática de wallets
 * - Soporte para Coinbase Wallet y MetaMask
 * - Dropdown con opciones de desconexión
 */

import {
    ConnectWallet as OnchainKitConnectWallet,
    Wallet,
    WalletDropdown,
    WalletDropdownLink,
    WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet'
import {
    Address,
    Avatar,
    Name,
    Identity,
} from '@coinbase/onchainkit/identity'

interface ConnectWalletProps {
    className?: string
}

export function ConnectWallet({ className }: ConnectWalletProps) {
    return (
        <div className={className}>
            <Wallet>
                {/* Botón de conexión - se transforma en identidad cuando conectado */}
                <OnchainKitConnectWallet>
                    <Avatar className="h-6 w-6" />
                    <Name />
                </OnchainKitConnectWallet>

                {/* Dropdown que aparece al hacer clic cuando está conectado */}
                <WalletDropdown>
                    {/* Mostrar identidad del usuario */}
                    <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                        <Avatar />
                        <Name />
                        <Address />
                    </Identity>

                    {/* Botón de desconexión */}
                    <WalletDropdownDisconnect />
                </WalletDropdown>
            </Wallet>
        </div>
    )
}
