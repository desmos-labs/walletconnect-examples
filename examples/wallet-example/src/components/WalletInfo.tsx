import React, {useEffect, useState} from "react";
import {useWalletContext, WalletGenerationState} from "../context/walletcontext";
import {Button, TextField} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";

export interface Props {
}

export const WalletInfo: React.FC<Props> = (props) => {
  const {walletState} = useWalletContext()
  const [address, setAddress] = useState<string>();

  // Effect to update the wallet address.
  useEffect(() => {
    (async () => {
      if (walletState?.state === WalletGenerationState.GENERATED) {
        const accounts = await walletState.signer.getAccounts();
        if (accounts.length > 0) {
          setAddress(accounts[0].address)
        }
      }
    })()
  }, [walletState])

  return <Grid2 container direction={"column"} alignItems={"center"}>
    <Grid2 xs={12}>
      <TextField
        fullWidth
        multiline
        value={address}
        disabled={true}
        label={"Address"}
      />
    </Grid2>
  </Grid2>
}
