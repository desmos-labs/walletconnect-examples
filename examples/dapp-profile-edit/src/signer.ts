import {AccountData, decodePubkey, DirectSignResponse,} from "@cosmjs/proto-signing";
import {SessionTypes} from "@walletconnect/types";
import WalletConnectClient from "@walletconnect/sign-client";
import {stringifySignDocValues} from "cosmos-wallet";
import {Buffer} from "buffer";
import {AuthInfo, SignDoc} from "cosmjs-types/cosmos/tx/v1beta1/tx";
import {AminoSignResponse, StdSignDoc} from "@cosmjs/amino";
import {fromBase64} from "@cosmjs/encoding";
import {assert} from "@cosmjs/utils";
import {Signer, SignerStatus, SigningMode} from "@desmoslabs/desmjs";
import QRCodeModal from "@walletconnect/qrcode-modal";
import {SignClientTypes} from "@walletconnect/types/dist/types/sign-client/client";

export interface WalletConnectSignerOptions {
  signingMode: SigningMode;
  // The chains to which the client can connect.
  // Can be: desmos:desmos-mainnet or desmos:morpheus-apollo-4.
  chain: string
}

/**
 * Signer that use the WalletConnect protocol to sign a transaction.
 */
export class WalletConnectSigner extends Signer {
  public readonly signingMode: SigningMode = SigningMode.AMINO;

  private readonly client: WalletConnectClient;

  private readonly chain: string;

  private accountData: AccountData | undefined;

  private walletConnectSession: SessionTypes.Struct | undefined

  private readonly sessionUpdateListener = (params: SignClientTypes.EventArguments["session_update"]) => {
    console.log("WalletConnectSigner.sessionUpdateListener", params);
  }

  private readonly sessionDeleteListener = (params: SignClientTypes.EventArguments["session_delete"]) => {
    console.log("WalletConnectSigner.sessionDeleteListener", params);
    this.updateStatus(SignerStatus.Disconnecting);
    this.clearSessionDependentResources();
    this.updateStatus(SignerStatus.NotConnected);
  }

  constructor(
    client: WalletConnectClient,
    options: WalletConnectSignerOptions
  ) {
    super(SignerStatus.NotConnected);
    this.signingMode = options.signingMode;
    this.client = client;
    this.chain = options.chain;
  }

  private populateSessionDependedFields({ accounts }: { accounts: string[] }) {
    this.accountData = {
      address: accounts[0],
      algo: "secp256k1",
      pubkey: Uint8Array.from([0x02, ...new Array(32).fill(0)]),
    };
  }

  /**
   * Subscribes to all the WalletConnect events.
   * @private
   */
  private subscribeToEvents() {
    // Subscribe to the session update event
    this.client.on("session_update", this.sessionUpdateListener);
    // Subscript to disconnect session
    this.client.on("session_delete", this.sessionDeleteListener);
  }

  /**
   * Unsubscribe all the WalletConnect events.
   * @private
   */
  private unsubscribeEvents() {
    this.client.off("session_update", this.sessionDeleteListener);
    this.client.off("session_delete", this.sessionDeleteListener);
  }

  /**
   * Release all the resources related to the current session.
   * @private
   */
  private clearSessionDependentResources() {
    this.walletConnectSession = undefined;
    this.accountData = undefined;
  }

  /**
   * Implements Signer.
   */
  async connect(): Promise<void> {
    if (this.status !== SignerStatus.NotConnected) {
      return;
    }

    this.updateStatus(SignerStatus.Connecting);

    const methods = ["cosmos_getAccounts"];
    if (this.signingMode === SigningMode.AMINO) {
      methods.push("cosmos_signAmino");
    } else if (this.signingMode === SigningMode.DIRECT) {
      methods.push("cosmos_signDirect");
    } else {
      console.error("Unknown sign mode", this.signingMode);
    }

    const namespaces = {
      desmos: {
        methods: methods,
        chains: [this.chain],
        events: ["chainChanged", "accountsChanged"]
      }
    }

    try {
      const {uri, approval} = await this.client.connect({requiredNamespaces: namespaces})

      // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
      if (uri) {
        QRCodeModal.open(uri, () => {
          console.log("EVENT", "QR Code Modal closed");
        });
      } else {
        throw new Error("can't get connection uri");
      }

      this.walletConnectSession = await approval();

      // Now it's connected, ask the client the information about the current accounts.
      const accounts = await this.getAccounts();

      if (accounts.length > 0) {
        this.accountData = accounts[0]
      }

      this.subscribeToEvents();

      this.updateStatus(SignerStatus.Connected);
    } catch (e) {
      // Log the exception and throw to the caller.
      console.error("WalletConnectSigner.connect", e);
      this.clearSessionDependentResources();
      this.updateStatus(SignerStatus.NotConnected);
      throw e;
    } finally {
      // Close the QRCode modal in case it was open.
      QRCodeModal.close();
    }
  }

  /**
   * Implements Signer.
   */
  async disconnect(): Promise<void> {
    if (this.status !== SignerStatus.Connected) {
      return;
    }

    this.updateStatus(SignerStatus.Disconnecting);
    try {
      this.unsubscribeEvents();

      await this.client.disconnect({
        topic: this.walletConnectSession!.topic,
        reason: {
          code: 0,
          message: "connection closed by the user"
        }
      });
    } catch (e) {
      console.error("WalletConnectSigner.disconnect", e);
      throw e;
    } finally {
      this.clearSessionDependentResources();
      this.updateStatus(SignerStatus.NotConnected);
    }
  }

  /**
   * Implements Signer.
   *
   * NOTE: The returned AccountData will contain an empty public key and a default algorithm set to "secp256k1".
   * This is because WalletConnect does not return the public key nor the algorithm used after the connection.
   */
  async getCurrentAccount(): Promise<AccountData | undefined> {
    return this.accountData;
  }

  /**
   * Implements Signer.
   *
   * NOTE: This method might never return anything if the wallet is currently closed, due to the fact that all
   * WalletConnect requests are asynchronous and complete only when the associated wallet is opened.
   * If you want to get the currently used account, use `getCurrentAccount` instead.
   */
  async getAccounts(): Promise<readonly AccountData[]> {
    this.assertConnected();

    const result = await this.client.request<object []>({
      topic: this.walletConnectSession!.topic,
      chainId: this.chain,
      request: {
        method: "cosmos_getAccounts",
        params: [],
      }
    });

    return result.map((accountData: any) => {
      return {
        address: accountData.address,
        algo: accountData.algo,
        pubkey: fromBase64(accountData.pubkey),
      };
    });
  }

  /**
   * Implements OfflineDirectSigner.
   */
  async signDirect(
    signerAddress: string,
    signDoc: SignDoc
  ): Promise<DirectSignResponse> {
    this.assertConnected();
    assert(this.accountData);

    const params = {
      signerAddress,
      signDoc: stringifySignDocValues(signDoc),
    };

    const result = await this.client.request<any>({
      topic: this.walletConnectSession!.topic,
      chainId: this.chain,
      request: {
        method: "cosmos_signDirect",
        params: [params],
      }
    });

    const authInfoBytes = Uint8Array.from(
      Buffer.from(result.authInfoBytes, "hex")
    );
    const resultSignDoc = SignDoc.fromPartial({
      bodyBytes: Uint8Array.from(Buffer.from(result.bodyBytes, "hex")),
      authInfoBytes,
      chainId: signDoc.chainId,
      accountNumber: signDoc.accountNumber,
    });

    // Extract the public key from the response
    const authInfo = AuthInfo.decode(authInfoBytes);
    const pubKey = decodePubkey(authInfo.signerInfos[0].publicKey);
    if (pubKey === null) {
      throw new Error("The client didn't provide the public key");
    }

    return {
      signed: resultSignDoc,
      signature: {
        signature: Buffer.from(result.signature, "hex").toString("base64"),
        pub_key: pubKey,
      },
    };
  }

  /**
   * Implements OfflineDirectSigner.
   */
  async signAmino(
    signerAddress: string,
    signDoc: StdSignDoc
  ): Promise<AminoSignResponse> {
    this.assertConnected();
    assert(this.accountData);

    const params = {
      signerAddress,
      signDoc,
    };

    const result = await this.client.request<any>({
      topic: this.walletConnectSession!.topic,
      chainId: this.chain,
      request: {
        method: "cosmos_signAmino",
        params: [params],
      }
    });

    return {
      signed: signDoc,
      signature: {
        signature: result.signature,
        pub_key: result.pub_key,
      },
    } as AminoSignResponse;
  }
}
