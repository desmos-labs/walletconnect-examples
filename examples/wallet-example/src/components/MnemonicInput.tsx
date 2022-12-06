import React, {ChangeEvent, useCallback, useEffect, useState} from "react";
import {useWalletContext, WalletStatus} from "../context/walletcontext";
import {Button, TextField} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";

export interface Props {
  children?: React.ReactNode
}

export const MnemonicInput: React.FC<Props> = (props) => {
  const {walletState, connectWallet, disconnectWallet} = useWalletContext();
  const [mnemonic, setMnemonic] = useState(walletState?.status === WalletStatus.CONNECTED ? walletState.mnemonic : "");
  const inputEnabled = walletState.status === WalletStatus.NOT_CONNECTED || walletState.status === WalletStatus.ERROR;
  const connecting = walletState.status === WalletStatus.CONNECTING;
  const error = walletState?.status === WalletStatus.ERROR ? walletState.error : undefined;

  // Effect to update the mnemonic input when the mnemonic generation completes
  useEffect(() => {
    if (walletState?.status === WalletStatus.CONNECTED) {
      setMnemonic(walletState.mnemonic)
    }
  }, [walletState]);

  const onMnemonicChange = useCallback((e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setMnemonic(e.target.value);
  }, [])

  const connectDisconnect = useCallback(() => {
    const status = walletState.status;
    if (status === WalletStatus.CONNECTED) {
      disconnectWallet();
    } else if (status === WalletStatus.NOT_CONNECTED || status === WalletStatus.ERROR){
      connectWallet(mnemonic);
    }
  }, [mnemonic, walletState])

  return <Grid2 container direction={"column"} alignItems={"center"}>
    <Grid2 xs={12}>
      <TextField
        fullWidth
        value={mnemonic}
        disabled={!inputEnabled}
        multiline={true}
        label={"Mnemonic"}
        onChange={onMnemonicChange}
        error={error !== undefined}
        helperText={error?.message}
      />
    </Grid2>
    <Grid2>
      <Button
        onClick={connectDisconnect}
        disabled={connecting}
      >
        {walletState.status === WalletStatus.CONNECTED ? "Disconnect" : "Connect"}
      </Button>
    </Grid2>
  </Grid2>
}
