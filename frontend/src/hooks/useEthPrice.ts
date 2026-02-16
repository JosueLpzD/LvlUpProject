import { useState, useEffect } from 'react';

export function useEthPrice() {
    const [price, setPrice] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                // Try CoinGecko first
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
                if (response.ok) {
                    const data = await response.json();
                    if (data.ethereum?.usd) {
                        setPrice(data.ethereum.usd);
                        setIsLoading(false);
                        return;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch from CoinGecko, trying backfill...');
            }

            // Fallback: Coinbase API (Public)
            try {
                const response = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot');
                if (response.ok) {
                    const data = await response.json();
                    if (data.data?.amount) {
                        setPrice(parseFloat(data.data.amount));
                        setIsLoading(false);
                        return;
                    }
                }
            } catch (err) {
                console.error('All price APIs failed');
            }

            // Ultimate Fallback (Hardcoded recent price)
            setPrice(2600); // Approximate fallback
            setIsLoading(false);
        };

        fetchPrice();
        // Refresh every 5 minutes
        const interval = setInterval(fetchPrice, 300000);
        return () => clearInterval(interval);
    }, []);

    return { price, isLoading };
}
