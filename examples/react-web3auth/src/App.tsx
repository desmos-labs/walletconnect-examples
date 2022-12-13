import React from "react";
import Grid2 from "@mui/material/Unstable_Grid2";
import {SignerContextProvider} from "./context/signercontext";
import Header from "./components/Header";
import ProfileEdit from "./screen/ProfileEdit";

const AppRoot: React.FC = () => {
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
  return <SignerContextProvider>
    <AppRoot/>
  </SignerContextProvider>
}
