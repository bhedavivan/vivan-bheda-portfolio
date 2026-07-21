---
title: "Limit Order Book Engine (lob-engine)"
description: "A C++ engine that reconstructs live crypto-exchange order books in real time and backtests short-horizon trading signals on the rebuilt book."
techStack:
  - "C++"
  - "Python"
  - "CMake"
  - "WebSockets"
  - "scikit-learn"
repoUrl: "https://github.com/bhedavivan/lob-engine"
imageUrl: "/images/uploads/lob-engine.png"
featured: true
order: 1
---
A from-scratch C++ engine that ingests live Level-2 market data from crypto exchanges (Coinbase, Kraken, Binance.US) and rebuilds the full limit order book in memory. On top of the reconstructed book sit a backtester for order-flow-imbalance signals, a passive market-making simulation with a queue-position fill model, and a short-horizon price-direction model evaluated walk-forward. I profiled and optimized the hot path — cutting per-row parse time about 6x and adding a cache-friendly flat-array book validated by a differential test against the reference — and added a live streaming pipe, Linux/Windows CI, and a zero-dependency browser dashboard that reconstructs any supported book live.
