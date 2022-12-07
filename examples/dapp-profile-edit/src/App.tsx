import React from "react";
import ProfileEdit from "./screen/ProfileEdit";
import Header from "./components/Header";
import {Container, makeStyles} from "@material-ui/core";
import {DesmosContextProvider} from "./context/desmos";
import {WalletConnectContextProvider} from "./context/walletconnect";

const useStyle = makeStyles(theme => {
  return {
    root: {
      display: "flex",
      flexDirection: "column",
      flexGrow: 1,
    }
  }
})

const AppRoot: React.FC = (props) => {
  const classes = useStyle();
  return <div className={classes.root}>
    <Header/>
    <Container>
      <ProfileEdit/>
    </Container>
  </div>
}

export default function App(): JSX.Element {
  return <WalletConnectContextProvider>
    <DesmosContextProvider chainEndpoint="https://rpc.morpheus.desmos.network:443">
      <AppRoot/>
    </DesmosContextProvider>
  </WalletConnectContextProvider>
}
