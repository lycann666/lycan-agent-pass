# Lycan Agent Pass

A free NFT pass on BNB Chain, mintable only by holders of a Binance Agent ID (`name.ai`).
Built for the **Binance Agent ID Hackathon** (submission 18 Nov – 9 Dec 2026, 08:00 UTC).

- **Name / symbol:** Lycan Agent Pass / LAP
- **Chain:** BNB Chain (chain ID 56)
- **Supply:** 1,000, one per wallet, sequential tokenIds from 1
- **Price:** free mint — value 0, gas only
- **Gate:** caller must hold an Agent ID. The contract reads
  `balanceOf(msg.sender)` on the Agent ID registry
  `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` (SPACE ID Agent ID, ERC-721 soulbound).
- **Website:** `website/` (static mint site, ethers v6 + `window.ethereum`)
- **Owner / deployer:** lycan — Agent ID `lycan.ai`, wallet
  `0x643F977024Fea9e1518D5Dcf2e83A92789ae947C`, X [@69lycan](https://x.com/69lycan)

Holding a pass promises no returns, no income, and no future value. It is a
collectible pass for Agent ID holders.

## Contract design

`contracts/LycanAgentPass.sol` — Solidity ^0.8.20, MIT, OpenZeppelin ERC721 + Ownable.

- `mint()` — free, checks supply < 1000, `hasMinted[msg.sender] == false`,
  and Agent ID `balanceOf(msg.sender) > 0`. Emits `Minted(to, tokenId)`.
- `totalSupply()` / `totalMinted` / `hasMinted(address)` — read helpers.
- `tokenURI(tokenId)` = `baseURI + tokenId + ".json"` (OpenZeppelin default).

### Owner permissions — the complete list

The owner has exactly **one project-specific** privileged function:

- `setBaseURI(string)` — point token metadata at the hosted site.

(OpenZeppelin Ownable also adds the standard `transferOwnership` /
`renounceOwnership`, which only change *who* the owner is.) The owner
**cannot** mint, pause, change the supply, change the Agent ID registry
address, freeze or burn other people's tokens, or withdraw anything. The
contract holds no funds and has no payable functions besides the free
`mint()` (value 0).

## Build (done)

- solc **0.8.26+commit.8a97fa7a**, optimizer enabled, runs 200. **0 warnings.**
- Bytecode: 5,809 bytes, sha256
  `d5c856e5d69182a7a041536fc58f415573c46db6bb9fc1c295452d6aff6c905b`
  (see `build/bytecode.txt`; sha256 is of the file `0x…` hex text).
- ABI: `build/abi.json`. Gas estimates: `build/gasEstimates.json`.

Rebuild any time with:

```bash
cd ~/workspace/lycan-agent-pass
npm install          # solc + @openzeppelin/contracts (already installed)
node scripts/compile.js
```

## Live on-chain checks (done 19 Nov 2026, ~06:55 WIB)

- Agent ID registry `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` **is a contract**
  (code present, 17,514 chars).
- `balanceOf(0x643F977024Fea9e1518D5Dcf2e83A92789ae947C)` = **1** — the deployer
  wallet holds Agent ID `lycan.ai` and can mint.
- BSC gasPrice at check time: **0.05 gwei**.
- Deployment gas estimate (read-only `eth_estimateGas` simulation, no tx sent):
  **1,267,249 gas ≈ 0.000063 BNB** at 0.05 gwei — well under the wallet's
  ~0.000812 BNB. Results in `build/onchain-checks.json`.

## Deploy + verify (NOT done — needs the user's explicit confirmation)

Deploy from the wallet `0x643F977024Fea9e1518D5Dcf2e83A92789ae947C` on BNB Chain.
A fresh preview must be shown and explicitly confirmed before any transaction.

```bash
# 1. Deploy LycanAgentPass.sol (constructor takes no arguments).
#    Use Remix, Hardhat, or the Binance Agentic Wallet CLI (baw) preview.
#    Expected: ~1.27M gas, ~0.000063 BNB at 0.05 gwei.

# 2. Verify source on BscScan (flatten or standard-JSON with the
#    @openzeppelin imports; compiler 0.8.26, optimizer on, runs 200):
#    https://bscscan.com/verifyContract — paste the contract address,
#    select Solidity 0.8.26, MIT license.

# 3. Host the site (website/) and set the metadata base URI:
#    - Generate full metadata:  python3 scripts/gen-metadata.py --full --base-url https://<host>/metadata/
#      (samples 1..10 already generated; image URL placeholder must be replaced
#       with the final hosted URL)
#    - Owner calls setBaseURI("https://<host>/metadata/") — the only owner tx.
#    - Fill CONFIG.CONTRACT_ADDRESS in website/app.js and the BscScan link
#      in website/index.html.
```

## Hackathon rules compliance

- Deployed on BNB Chain, source verified + open-source on BscScan (after step 2).
- Actively uses Agent ID: mint is gated on holding an Agent ID — access-control
  use case, core to the product, not a label.
- No web QR login for Agentic Wallet; the site uses injected `window.ethereum`
  only. No session storage, no server-side sessions, no auto-transactions —
  the user confirms the mint in their own wallet.
- No promised returns anywhere (contract, site, metadata, drafts).
- No Binance/BNB branding impersonation: the name "Lycan Agent Pass" and the
  gold-on-dark art are original; the site states it is not affiliated with
  or endorsed by Binance.
- No collection of seeds, keys, API secrets, or pairing codes — nothing is
  collected at all.
- No trading product, so no risk-warning page is needed; the site still carries
  an honest "free except gas, no promised value" note.
- Innovation Award eligibility needs ≥30 Agent ID addresses interacting with
  the contract during the submission period — that requires promoting the mint
  after deploy; it is not guaranteed by deploying alone.

## Files

```text
contracts/LycanAgentPass.sol   contract source
scripts/compile.js             solc compile (writes build/)
scripts/onchain-checks.js      live registry + gas + deploy-gas estimate
scripts/gen-metadata.py        metadata generator (samples 1..10 generated)
build/abi.json                 contract ABI
build/bytecode.txt             creation bytecode (sha256 above)
build/deployedBytecode.txt     runtime bytecode
build/gasEstimates.json        solc gas estimates
build/onchain-checks.json      live check results
website/index.html             mint site
website/style.css              site styles
website/app.js                 ethers v6 mint logic (CONTRACT_ADDRESS TBD)
website/assets/pass.svg        code-drawn badge art (dark + gold)
website/metadata/1.json..10.json  sample metadata (image URL placeholder)
form-draft.md                  Binance submission form draft answers
x-post-draft.md                Community Promotion Award X post drafts
```
