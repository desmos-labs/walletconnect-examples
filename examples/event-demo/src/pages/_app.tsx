import type { AppProps } from 'next/app'
import Header from "../components/Header";
import {SignerContextProvider} from "../context/signer";
import theme from "../utils/theme";
import {CssBaseline, ThemeProvider} from "@mui/material";

import { QueryClient, QueryClientProvider } from 'react-query'
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect:false,
    },
  },
})

export default function App({ Component, pageProps }: AppProps) {
  return <QueryClientProvider client={queryClient} contextSharing={true}>
    <ThemeProvider theme={theme}>
    <CssBaseline enableColorScheme/>
      <SignerContextProvider>
        <Header />
        <Component {...pageProps} />
      </SignerContextProvider>
    </ThemeProvider>
  </QueryClientProvider>
}