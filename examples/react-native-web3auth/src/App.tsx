/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  Linking,
  SafeAreaView,
  StyleProp,
  StyleSheet,
  Text,
  useColorScheme, View,
  ViewStyle,
} from 'react-native';
import {Appbar, Button, Menu, Provider as PaperProvider, useTheme} from 'react-native-paper';
import {Colors,} from 'react-native/Libraries/NewAppScreen';
import {SignerContextProvider, useSignerContext} from "./context/signercontext";
import useSignerStatus from "./hooks/useSignerStatus";
import {SignerStatus} from "@desmoslabs/desmjs";
import useDesmosClient from "./hooks/useDesmosClient";
import {LOGIN_PROVIDER} from "@web3auth/react-native-sdk";


function sisgnerStatusToString(signerStatus: SignerStatus): string {
  switch (signerStatus) {
    case SignerStatus.NotConnected:
      return "NotConnected";
    case SignerStatus.Connecting:
      return "Connecting";
    case SignerStatus.Connected:
      return "Connected";
    case SignerStatus.Disconnecting:
      return "Disconnecting";
    default:
      return "Unknown";
  }
}

const AppRoot = () => {
  const {connect, disconnect, signer} = useSignerContext();
  const client = useDesmosClient();
  const [menuVisible, setMenuVisible] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const signerStatus = useSignerStatus();
  const theme = useTheme();

  const onConnectPress = useCallback(() => {
    if (signerStatus === SignerStatus.Connected) {
      disconnect();
    } else if (signerStatus === SignerStatus.NotConnected) {
      setMenuVisible(true);
    }
  }, [signerStatus, connect, disconnect]);

  const showUserOnExplorer = useCallback(() => {
    if (userAddress.length > 0) {
      Linking.openURL(`https://bigdipper.live/desmos/accounts/${userAddress}`)
    }
  }, [userAddress])

  useEffect(() => {
    if (signerStatus === SignerStatus.Connected && signer !== undefined && client !== undefined) {
      (async () => {
        const [account] = await signer.getAccounts();
        setUserAddress(account.address);
      })()
    } else if (signerStatus === SignerStatus.NotConnected) {
      setUserAddress("");
    }
  }, [signer, signerStatus, client])

  return (
    <SafeAreaView style={StyleSheet.compose<ViewStyle>(styles.container, {
      backgroundColor: theme.colors.background
    })}>
      <Appbar.Header>
        <Appbar.Content title="Web3Auth Demo"/>
      </Appbar.Header>

      <Text
        style={styles.padding}
      >
        Status: {sisgnerStatusToString(signerStatus)}
      </Text>
      <Text
        style={styles.padding}
      >
        Address: {userAddress}
      </Text>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button
            style={styles.margin}
            mode="contained"
            disabled={signerStatus !== SignerStatus.Connected && signerStatus !== SignerStatus.NotConnected}
            onPress={onConnectPress}
          >
            {signerStatus === SignerStatus.Connected ? "Disconnect" : "Connect"}
          </Button>
        }
      >
        {Object.values(LOGIN_PROVIDER)
          .filter(element =>
            element !== LOGIN_PROVIDER.JWT &&
            element !== LOGIN_PROVIDER.EMAIL_PASSWORDLESS
          )
          .map((element, i) => {
            return <Menu.Item
              key={i}
              title={element}
              onPress={() => {
                setMenuVisible(false);
                connect(element);
              }}
            />
          })}
      </Menu>


      <Button
        style={styles.margin}
        mode="contained"
        onPress={showUserOnExplorer}
        disabled={userAddress === ""}
      >
        Show on explorer
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  padding: {
    padding: 5,
  },
  margin: {
    margin: 5,
  }
})

const App = () => {
  return <SignerContextProvider>
    <PaperProvider>
      <AppRoot/>
    </PaperProvider>
  </SignerContextProvider>
};

export default App;
