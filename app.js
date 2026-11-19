// Lycan Agent Pass — mint site logic (ethers v6, EIP-1193 via window.ethereum).
// No QR login, no session storage, no auto-transactions: the user connects
// their own wallet and confirms the mint transaction themselves.
"use strict";

// ---- CONFIG: fill in after the contract is deployed + verified ----
// TODO (deploy step): set CONTRACT_ADDRESS to the deployed contract address
// and update the BscScan link in index.html.
const CONFIG = {
  CONTRACT_ADDRESS: "0x81CF8356F354f8bB454200C0a8aAaa22131C7215", // e.g. "0x..." — empty until deployed
  CHAIN_ID: 56, // BNB Chain mainnet
  AGENT_ID_REGISTRY: "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F",
};

const PASS_ABI = [
  "function mint() external",
  "function totalSupply() external view returns (uint256)",
  "function MAX_SUPPLY() external view returns (uint256)",
  "function hasMinted(address) external view returns (bool)",
];
const AGENT_ID_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
];

const $ = (id) => document.getElementById(id);
const els = {
  connectBtn: $("connectBtn"),
  mintBtn: $("mintBtn"),
  walletLine: $("walletLine"),
  walletAddr: $("walletAddr"),
  statusBox: $("statusBox"),
  txLine: $("txLine"),
  minted: $("minted"),
  maxSupply: $("maxSupply"),
  supplyNote: $("supplyNote"),
  contractLink: $("contractLink"),
};

let provider = null;
let signer = null;
let account = null;
let passContract = null;

function showStatus(text, kind) {
  els.statusBox.classList.remove("hidden", "ok", "no", "info");
  els.statusBox.classList.add(kind);
  els.statusBox.textContent = text;
}

async function refreshSupply() {
  if (!passContract) return;
  try {
    const [minted, max] = await Promise.all([
      passContract.totalSupply(),
      passContract.MAX_SUPPLY(),
    ]);
    els.minted.textContent = minted.toString();
    els.maxSupply.textContent = max.toString();
    els.supplyNote.textContent =
      minted >= max ? "Sold out." : `${max - minted} left.`;
  } catch (e) {
    els.minted.textContent = "—";
  }
}

async function checkEligibility() {
  if (!provider || !account || !passContract) return;
  try {
    const registry = new ethers.Contract(CONFIG.AGENT_ID_REGISTRY, AGENT_ID_ABI, provider);
    const [agentBalance, alreadyMinted] = await Promise.all([
      registry.balanceOf(account),
      passContract.hasMinted(account),
    ]);
    if (alreadyMinted) {
      showStatus("You already minted your Lycan Agent Pass. One pass per wallet.", "info");
      els.mintBtn.disabled = true;
    } else if (agentBalance === 0n) {
      showStatus(
        "This wallet does not hold an Agent ID (name.ai), so it cannot mint. " +
        "Only Agent ID holders can mint this pass.",
        "no"
      );
      els.mintBtn.disabled = true;
    } else {
      showStatus("Agent ID found on this wallet. You can mint your free pass.", "ok");
      els.mintBtn.disabled = false;
    }
  } catch (e) {
    showStatus("Could not check eligibility: " + (e.shortMessage || e.message), "no");
  }
}

async function connect() {
  if (!window.ethereum) {
    showStatus("No wallet found. Open this site in a wallet browser (e.g. Binance Wallet) or install a wallet extension.", "no");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    account = accounts[0];
    signer = await provider.getSigner();
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== CONFIG.CHAIN_ID) {
      showStatus("Please switch your wallet to BNB Chain (chain ID 56) and reconnect.", "no");
      return;
    }
    els.walletAddr.textContent = account;
    els.walletLine.classList.remove("hidden");
    els.connectBtn.textContent = "Connected";
    els.connectBtn.disabled = true;
    els.mintBtn.classList.remove("hidden");
    await refreshSupply();
    await checkEligibility();
  } catch (e) {
    showStatus("Connection failed: " + (e.shortMessage || e.message), "no");
  }
}

async function mint() {
  if (!passContract || !signer || !account) return;
  els.mintBtn.disabled = true;
  showStatus("Waiting for you to confirm the mint in your wallet…", "info");
  try {
    // Free mint: value 0, gas only. The wallet shows the exact fee before you confirm.
    const tx = await passContract.connect(signer).mint();
    els.txLine.classList.remove("hidden");
    els.txLine.innerHTML = `Transaction sent: <a href="https://bscscan.com/tx/${tx.hash}" target="_blank" rel="noopener">${tx.hash}</a> — waiting for confirmation…`;
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      showStatus("Minted! Your Lycan Agent Pass is in your wallet.", "ok");
      els.mintBtn.disabled = true;
      await refreshSupply();
    } else {
      showStatus("Transaction failed on-chain. No pass was minted.", "no");
      els.mintBtn.disabled = false;
    }
  } catch (e) {
    showStatus("Mint did not go through: " + (e.shortMessage || e.message), "no");
    els.mintBtn.disabled = false;
  }
}

els.connectBtn.addEventListener("click", connect);
els.mintBtn.addEventListener("click", mint);

window.addEventListener("load", async () => {
  if (!CONFIG.CONTRACT_ADDRESS) {
    // Not deployed yet: show supply placeholder and disable minting.
    els.supplyNote.textContent = "Contract not deployed yet — minting opens after deploy.";
    els.contractLink.textContent = "Contract: not deployed yet";
    els.contractLink.removeAttribute("href");
    return;
  }
  els.contractLink.href = `https://bscscan.com/address/${CONFIG.CONTRACT_ADDRESS}`;
  try {
    provider = new ethers.JsonRpcProvider("https://bsc-rpc.publicnode.com");
    passContract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, PASS_ABI, provider);
    await refreshSupply();
  } catch (e) {
    els.minted.textContent = "—";
  }
});
