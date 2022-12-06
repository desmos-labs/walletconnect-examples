import React, {ChangeEvent, useCallback, useEffect, useState} from "react";
import {useWalletContext, WalletGenerationState} from "../context/walletcontext";
import {Button, Container, TextField} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";

export interface Props {
  children?: React.ReactNode
}

export const MnemonicInput: React.FC<Props> = (props) => {
  const {walletState, generateWallet} = useWalletContext()
  const generatingWallet = walletState?.state === WalletGenerationState.GENERATING;
  const [mnemonic, setMnemonic] = useState(walletState?.state === WalletGenerationState.GENERATED ? walletState.mnemonic : "");
  const error = walletState?.state === WalletGenerationState.FAILED ? walletState.error : undefined;

  // Effect to update the mnemonic input when the mnemonic generation completes
  useEffect(() => {
    if (walletState?.state === WalletGenerationState.GENERATED) {
      setMnemonic(walletState.mnemonic)
    }
  }, [walletState]);

  const onMnemonicChange = useCallback((e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setMnemonic(e.target.value);
  }, [])

  const genWallet = useCallback(() => {
    generateWallet(mnemonic);
  }, [mnemonic])

  return <Grid2 container direction={"column"} alignItems={"center"}>
    <Grid2 xs={12}>
      <TextField
        fullWidth
        value={mnemonic}
        disabled={generatingWallet}
        multiline={true}
        label={"Mnemonic"}
        onChange={onMnemonicChange}
        error={error !== undefined}
        helperText={error?.message}
      />
    </Grid2>
    <Grid2>
      <Button
        onClick={genWallet}
        disabled={generatingWallet}
      >
        Generate
      </Button>
    </Grid2>
  </Grid2>
}
