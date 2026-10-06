import type { Page, TestInfo } from '@playwright/test';

export interface MockEthereumOptions {
  /** Account the injected wallet reports as selected. */
  account: string;
}

/**
 * Injects a deterministic EIP-1193 provider that answers the JSON-RPC calls ethers
 * makes while deploying the escrow contract from the employer's browser wallet
 * (`deployEscrowFromWallet`), so funding specs stay hermetic: no extension, no
 * Ganache, and the backend only ever sees the resulting deployment proof.
 *
 * Every request is recorded on `window.__mockRpcLog`; unknown methods are recorded on
 * `window.__unsupportedRpc` and rejected so a missing method fails loudly.
 */
export async function installMockEthereum(page: Page, options: MockEthereumOptions): Promise<void> {
  await page.addInitScript(({ account }: MockEthereumOptions) => {
    const chainId = '0x539';
    const blockNumber = '0x10';
    const blockHash = '0x' + 'ab'.padStart(64, '0');
    const txHash = (n: number) => '0x' + n.toString(16).padStart(64, '0');
    const signature = { r: txHash(0x11), s: txHash(0x22), v: 27 };
    const logsBloom = '0x' + '00'.repeat(256);

    const block = {
      number: blockNumber,
      hash: blockHash,
      parentHash: txHash(0xabcd),
      nonce: '0x0000000000000000',
      difficulty: '0x0',
      gasLimit: '0x1c9c380',
      gasUsed: '0x5208',
      timestamp: '0x66f00000',
      transactions: [],
      miner: '0x0000000000000000000000000000000000000000',
      extraData: '0x',
      baseFeePerGas: '0x3b9aca00',
      mixHash: txHash(0x33),
    };

    const txs: Record<string, Record<string, unknown>> = {};
    const listeners: Record<string, Array<(data: unknown) => void>> = {};
    const win = window as unknown as Record<string, unknown>;
    const log: string[] = [];
    const unsupported: string[] = [];
    const toastLog: string[] = [];
    const errorLog: string[] = [];
    let sent = 0;

    win.__mockRpcLog = log;
    win.__unsupportedRpc = unsupported;
    win.__toastLog = toastLog;
    win.__errorLog = errorLog;
    win.__ethereumCalls = 0;

    // Toasts auto-dismiss, so keep a rolling record for post-failure debugging.
    const watchToasts = () => {
      if (!document.body) {
        document.addEventListener('DOMContentLoaded', watchToasts);
        return;
      }
      new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement && node.hasAttribute('data-sonner-toast')) {
              toastLog.push(node.textContent ?? '');
            }
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    };
    watchToasts();
    window.addEventListener('error', (event) => errorLog.push(String(event.message)));
    window.addEventListener('unhandledrejection', (event) => errorLog.push(String(event.reason)));

    win.ethereum = {
      isMetaMask: true,
      async request(payload: { method: string; params?: unknown[] }) {
        const method = payload?.method;
        log.push(method);
        win.__ethereumCalls = Number(win.__ethereumCalls ?? 0) + 1;
        const params = payload.params ?? [];

        switch (method) {
          case 'eth_chainId':
            return chainId;
          case 'net_version':
            return '1337';
          case 'eth_blockNumber':
            return blockNumber;
          case 'eth_accounts':
          case 'eth_requestAccounts':
            return [account];
          case 'eth_getBalance':
            return '0xde0b6b3a7640000';
          case 'eth_getTransactionCount':
            return '0x0';
          case 'eth_estimateGas':
            return '0xf4240';
          case 'eth_gasPrice':
          case 'eth_maxPriorityFeePerGas':
            return '0x3b9aca00';
          case 'eth_feeHistory':
            return {
              oldestBlock: '0x1',
              baseFeePerGas: ['0x3b9aca00', '0x3b9aca00'],
              gasUsedRatio: [0.5],
              reward: [['0x3b9aca00']],
            };
          case 'eth_getBlockByNumber':
          case 'eth_getBlockByHash':
            return block;
          case 'eth_getCode':
            return '0x6080604052348015600f57600080fd5b50';
          case 'eth_call':
            return '0x';
          case 'eth_sendTransaction': {
            const request = (params[0] ?? {}) as Record<string, string>;
            sent += 1;
            const hash = txHash(sent);
            txs[hash] = {
              hash,
              type: '0x0',
              nonce: request.nonce ?? '0x0',
              blockHash,
              blockNumber,
              transactionIndex: '0x0',
              from: request.from ?? account,
              to: request.to ?? null,
              value: request.value ?? '0x0',
              gas: request.gas ?? '0xf4240',
              gasPrice: '0x3b9aca00',
              input: request.data ?? '0x',
              chainId,
              ...signature,
            };
            return hash;
          }
          case 'eth_getTransactionByHash':
            return txs[String(params[0])] ?? null;
          case 'eth_getTransactionReceipt': {
            const hash = String(params[0]);
            const transaction = txs[hash];
            if (!transaction) return null;
            return {
              transactionHash: hash,
              transactionIndex: '0x0',
              blockHash,
              blockNumber,
              from: transaction.from,
              to: transaction.to ?? null,
              cumulativeGasUsed: '0x5208',
              gasUsed: '0x5208',
              contractAddress: null,
              logs: [],
              logsBloom,
              status: '0x1',
              effectiveGasPrice: '0x3b9aca00',
              type: '0x0',
            };
          }
          case 'personal_sign':
          case 'eth_sign':
            return '0x' + 'ab'.repeat(65);
          case 'wallet_switchEthereumChain':
          case 'wallet_addEthereumChain':
          case 'wallet_revokePermissions':
            return null;
          default: {
            unsupported.push(String(method));
            throw new Error(`Unsupported mock wallet method ${String(method)}`);
          }
        }
      },
      on(event: string, cb: (data: unknown) => void) {
        (listeners[event] ??= []).push(cb);
      },
      removeListener(event: string, cb: (data: unknown) => void) {
        listeners[event] = (listeners[event] ?? []).filter((item) => item !== cb);
      },
    };
  }, options);
}

/**
 * Prints the injected wallet's RPC log plus any visible toast when a spec fails, so a
 * broken flow names the missing RPC method or the exact error toast instead of timing out.
 */
export async function debugOnFailure(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.status === testInfo.expectedStatus) return;
  const debug = await page
    .evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      return {
        rpcLog: (win.__mockRpcLog as string[] | undefined) ?? [],
        unsupportedRpc: (win.__unsupportedRpc as string[] | undefined) ?? [],
        ethereumCalls: win.__ethereumCalls ?? 0,
        toastLog: (win.__toastLog as string[] | undefined) ?? [],
        errorLog: (win.__errorLog as string[] | undefined) ?? [],
        toasts: Array.from(document.querySelectorAll('[data-sonner-toast]')).map(
          (node) => node.textContent,
        ),
      };
    })
    .catch(() => null);
  await testInfo.attach('mock-wallet-debug', {
    body: JSON.stringify(debug, null, 2),
    contentType: 'application/json',
  });
  console.log('[e2e mock wallet]', JSON.stringify(debug));
}
