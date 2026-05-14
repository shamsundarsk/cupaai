"""Commodity pricing engine — LME-based with fallback hardcoded values."""
from __future__ import annotations

import time
import httpx
import asyncio
from typing import Optional

# Hardcoded fallback prices (USD per kg) — realistic as of 2024-2025
FALLBACK_PRICES: dict[str, float] = {
    "lead": 2.10,           # ~$2,100/ton LME
    "copper": 9.50,         # ~$9,500/ton LME
    "aluminum": 2.50,       # ~$2,500/ton LME
    "cobalt": 28.00,        # ~$28,000/ton
    "lithium": 14.50,       # lithium carbonate ~$14,500/ton
    "nickel": 16.00,        # ~$16,000/ton
    "plastic": 0.85,        # recycled plastic pellets
}

# Cache for fetched prices
_price_cache: dict[str, float] = {}
_cache_timestamp: float = 0
_CACHE_TTL = 3600 * 6  # refresh every 6 hours


def get_price(material: str) -> float:
    """Get current price per kg for a material."""
    if _price_cache and (time.time() - _cache_timestamp < _CACHE_TTL):
        return _price_cache.get(material, FALLBACK_PRICES.get(material, 1.0))
    return FALLBACK_PRICES.get(material, 1.0)


async def fetch_live_prices() -> dict[str, float]:
    """
    Attempt to fetch live metal prices from free APIs.
    Falls back to hardcoded values on failure.
    """
    global _price_cache, _cache_timestamp

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Try metals.dev free API (no key needed for basic)
            resp = await client.get("https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=kg")
            if resp.status_code == 200:
                data = resp.json()
                metals = data.get("metals", {})
                if metals:
                    _price_cache = {
                        "lead": metals.get("lead", FALLBACK_PRICES["lead"]),
                        "copper": metals.get("copper", FALLBACK_PRICES["copper"]),
                        "aluminum": metals.get("aluminum", FALLBACK_PRICES["aluminum"]),
                        "cobalt": metals.get("cobalt", FALLBACK_PRICES["cobalt"]),
                        "nickel": metals.get("nickel", FALLBACK_PRICES["nickel"]),
                        "lithium": FALLBACK_PRICES["lithium"],  # rarely on free APIs
                        "plastic": FALLBACK_PRICES["plastic"],
                    }
                    _cache_timestamp = time.time()
                    return _price_cache
    except Exception:
        pass

    # Fallback
    _price_cache = FALLBACK_PRICES.copy()
    _cache_timestamp = time.time()
    return _price_cache


def get_all_prices() -> dict[str, float]:
    """Get all current prices."""
    if _price_cache:
        return _price_cache
    return FALLBACK_PRICES.copy()
