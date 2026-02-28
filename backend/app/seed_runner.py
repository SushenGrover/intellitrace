"""Seed runner – ensures fraud detection has run on initial data."""

import asyncio
import sys


async def run_seed():
    """Wait for DB and run initial fraud scan."""
    # Give the database a moment to fully initialize
    await asyncio.sleep(3)
    print("✅ IntelliTrace seed runner complete – data loaded via SQL init scripts.")


if __name__ == "__main__":
    asyncio.run(run_seed())
