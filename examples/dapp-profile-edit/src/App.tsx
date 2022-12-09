import React from "react";
import ProfileEdit from "./screen/ProfileEdit";
import Header from "./components/Header";
import {DesmosContextProvider} from "./context/desmos";
import {WalletConnectContextProvider} from "./context/walletconnect";
import Grid2 from "@mui/material/Unstable_Grid2";

const AppRoot: React.FC = (props) => {
  return <Grid2 container direction="column" spacing={2}>
    <Grid2>
      <Header/>
    </Grid2>
    <Grid2>
      <ProfileEdit/>
    </Grid2>
  </Grid2>
}

export default function App(): JSX.Element {
  return <WalletConnectContextProvider>
    <DesmosContextProvider chainEndpoint="https://rpc.morpheus.desmos.network:443">
      <AppRoot/>
    </DesmosContextProvider>
  </WalletConnectContextProvider>
}
