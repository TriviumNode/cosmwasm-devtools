import {
  CosmWasmClient,
  SigningCosmWasmClient,
  EnigmaUtils,
} from "secretjs";
import { DirectSecp256k1HdWallet, OfflineSigner } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { Account, AccountType } from "../accounts/accountsSlice";
import { getKeplr } from "../accounts/useKeplr";
import { SecretUtils } from "secretjs/types/enigmautils";

interface ClientConnection {
  client: CosmWasmClient;
  rpcEndpoint: string;
  restEndpoint: string;
}

interface SigningClientConnection extends ClientConnection {
  client: SigningCosmWasmClient;
  address: string;
}

class ConnectionManager {
  private queryingClientConnection: ClientConnection | undefined;
  private signingClientConnections: { [key: string]: SigningClientConnection } =
    {};

  getQueryClient = async (
    config: {
      [key: string]: string;
    },
    forceRefresh = false
  ): Promise<CosmWasmClient> => {
    const rpcEndpoint: string = config["rpcEndpoint"];
    const restEndpoint: string = config["restEndpoint"];
    if (
      this.queryingClientConnection === undefined ||
      this.queryingClientConnection.rpcEndpoint !== rpcEndpoint ||
      this.queryingClientConnection.restEndpoint !== restEndpoint ||
      forceRefresh
    ) {
      this.queryingClientConnection = {
        // client: await CosmWasmClient.connect(rpcEndpoint),
        client: new CosmWasmClient(restEndpoint),
        rpcEndpoint,
        restEndpoint
      };
    }

    return this.queryingClientConnection.client;
  };

  getSigningClient = async (
    account: Account,
    config: { [key: string]: string }
  ): Promise<SigningCosmWasmClient> => {
    const rpcEndpoint: string = config["rpcEndpoint"];
    const restEndpoint: string = config["restEndpoint"];
    const { address } = account;
    if (
      this.signingClientConnections[address] === undefined ||
      this.signingClientConnections[address].rpcEndpoint !== rpcEndpoint ||
      this.signingClientConnections[address].restEndpoint !== restEndpoint
    ) {
      let signer: OfflineSigner;
      let enigmautils: Uint8Array | SecretUtils;
      if (account.type === AccountType.Basic) {
        const prefix: string = config["addressPrefix"];
        signer = await DirectSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
          prefix,
        });
        enigmautils = EnigmaUtils.GenerateNewSeed();
      } else if (account.type === AccountType.Keplr) {
        const keplr = await getKeplr();
        const chainId: string = config["chainId"];
        await keplr.enable(chainId);
        signer = keplr.getOfflineSigner(chainId);
        enigmautils = keplr.getEnigmaUtils(chainId);
      } else {
        throw new Error("Invalid account type");
      }
      this.signingClientConnections[address] = {
        /* 
        client: await SigningCosmWasmClient.connectWithSigner(
          rpcEndpoint,
          signer,
          {
            gasPrice: GasPrice.fromString(
              `${config["gasPrice"]}${config["microDenom"]}`
            ),
          }
        ),
        */
        client: new SigningCosmWasmClient(
          restEndpoint,
          address,
          //@ts-ignore
          signer,
          enigmautils,
          {
            gasPrice: GasPrice.fromString(
              `${config["gasPrice"]}${config["microDenom"]}`
            ),
          }
        ),
        address,
        rpcEndpoint,
        restEndpoint
      };
    }
    return this.signingClientConnections[address].client;
  };
}

export default new ConnectionManager();
