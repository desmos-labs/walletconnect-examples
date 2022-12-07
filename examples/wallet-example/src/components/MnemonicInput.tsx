import React, {ChangeEvent, useCallback, useEffect, useState} from "react";
import {useWalletContext, SignerStatus} from "../context/SignerContext";
import {Button, TextField} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
import useWalletClearAllSessions from "../hooks/useWalletClearAllSessions";


export const MnemonicInput: React.FC = () => {
  const {signerState, connectWallet, disconnectWallet} = useWalletContext();
  const clearAllWalletConnectSessions = useWalletClearAllSessions();
  const [mnemonic, setMnemonic] = useState(signerState?.status === SignerStatus.Connected ? signerState.mnemonic : "");
  const inputEnabled = signerState.status === SignerStatus.NotConnected || signerState.status === SignerStatus.Error;
  const connecting = signerState.status === SignerStatus.Connecting;
  const error = signerState?.status === SignerStatus.Error ? signerState.error : undefined;

  // Effect to update the mnemonic input when the mnemonic generation completes
  useEffect(() => {
    if (signerState?.status === SignerStatus.Connected) {
      setMnemonic(signerState.mnemonic)
    }
  }, [signerState]);

  const onMnemonicChange = useCallback((e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setMnemonic(e.target.value);
  }, [])

  const connectDisconnect = useCallback(() => {
    const status = signerState.status;
    if (status === SignerStatus.Connected) {
      clearAllWalletConnectSessions();
      disconnectWallet();
    } else if (status === SignerStatus.NotConnected || status === SignerStatus.Error){
      connectWallet(mnemonic);
    }
  }, [mnemonic, signerState, clearAllWalletConnectSessions, connectWallet, disconnectWallet])

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
        {signerState.status === SignerStatus.Connected ? "Disconnect" : "Connect"}
      </Button>
    </Grid2>
  </Grid2>
}
