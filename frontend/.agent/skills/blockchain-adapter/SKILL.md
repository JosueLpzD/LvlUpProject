---
name: blockchain-adapter
description: Best practices for Web3, Wallet connections, and Blockchain interactions. Use when working with ethers.js, viem, or wallet connectivity.
---

# Blockchain Adapter Skill

## Rules

- **Client Components**: Always use `'use client'` for components handling wallet connections.
- **Architecture**: Core blockchain logic (Ethers.js / Viem) MUST be placed in `/infrastructure/adapters`. Do not leak provider logic into UI components.
