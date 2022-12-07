import React from "react";
import {SignerContextProvider} from "./context/SignerContext";
import {MnemonicInput} from "./components/MnemonicInput";
import Grid2 from "@mui/material/Unstable_Grid2";
import {WalletInfo} from "./components/WalletInfo";
import {WalletConnectInfo} from "./components/WalletConnectInfo";
import {WalletConnectProvider} from "./context/WalletConnectContext";

const AppRoot: React.FC = () => {
  return <Grid2 container spacing={2} flex={1} direction={"row"} columns={2}>
    <Grid2 xs={1}>
      <WalletInfo/>
      <MnemonicInput/>
    </Grid2>
    <Grid2 xs={1}>
      <WalletConnectInfo/>
    </Grid2>
  </Grid2>
}

export default function App(): JSX.Element {
  return <Grid2 container direction="row" columns={2} margin={4}>
    <SignerContextProvider>
      <WalletConnectProvider>
        <AppRoot/>
      </WalletConnectProvider>
    </SignerContextProvider>
  </Grid2>
}
