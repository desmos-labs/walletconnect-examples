import {
  PrivateKey,
  PrivateKeyProvider,
  PrivateKeyProviderStatus,
  PrivateKeySigner,
  PrivateKeyType,
  Signer,
  SigningMode
} from "@desmoslabs/desmjs";
import Web3Auth, {SdkLoginParams, SUPPORTED_KEY_CURVES} from "@web3auth/react-native-sdk";
import {fromHex} from "@cosmjs/encoding"

export class Web3AuthKeyProvider extends PrivateKeyProvider {

  private readonly web3auth: Web3Auth;

  private readonly loginParams: SdkLoginParams;

  private privateKey?: PrivateKey;

  constructor(web3auth: Web3Auth, loginParams: Omit<SdkLoginParams, "curve">) {
    super();
    this.web3auth = web3auth;
    this.loginParams = {
      ...loginParams,
      curve: SUPPORTED_KEY_CURVES.SECP256K1,
    };
  }

  async connect(): Promise<void> {
    this.updateStatus(PrivateKeyProviderStatus.Connecting);
    const response = await this.web3auth.login(this.loginParams);

    if (response.privKey === undefined) {
      this.updateStatus(PrivateKeyProviderStatus.NotConnected);
      throw new Error("can't connect privateKey is undefined");
    }

    this.privateKey = {
      type: PrivateKeyType.Secp256k1,
      key: fromHex(response.privKey)
    };

    this.updateStatus(PrivateKeyProviderStatus.Connected);
  }

  async disconnect(): Promise<void> {
    this.updateStatus(PrivateKeyProviderStatus.Disconnecting);
    try {
      await this.web3auth.logout({
        redirectUrl: this.loginParams.redirectUrl
      });
    } catch (e) {
      console.error(e);
      this.updateStatus(PrivateKeyProviderStatus.NotConnected);
      throw e;
    }

    this.updateStatus(PrivateKeyProviderStatus.NotConnected);
  }

  async getPrivateKey(): Promise<PrivateKey> {
    if (this.privateKey === undefined) {
      throw new Error("can't get private key, Web3AuthKeyProvider not connected");
    }

    return this.privateKey;
  }
}

export function web3authSigner(web3auth: Web3Auth, loginParams: Omit<SdkLoginParams, "curve">, signingMode: SigningMode): Signer {
  return new PrivateKeySigner(new Web3AuthKeyProvider(web3auth, loginParams), signingMode);
}
