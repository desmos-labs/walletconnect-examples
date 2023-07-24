import React from "react";
import { useQuery } from 'react-query'
import List from "@mui/material/List";
import Grid2 from "@mui/material/Unstable_Grid2";
import TextField from "@mui/material/TextField";
import CreateIcon from "@mui/icons-material/Create";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import {SignerStatus} from "@desmoslabs/desmjs";
import {DesmosClient, GasPrice} from "@desmoslabs/desmjs";

import useDesmosClient from "../../hooks/useDesmosClient";
import {Post} from "../../components/Post";
import {useSignerContext} from "../../context/signer";
import useSignerStatus from "../../hooks/useSignerStatus";

import Long from "long";

export default function Forum() : JSX.Element {
  const signerStatus = useSignerStatus();
  const signerClient = useDesmosClient();
  
  const { data, isLoading, isError, isSuccess } = useQuery(
    "profile",
    async() => {
      let client: DesmosClient;
      if (signerClient !== undefined) {
        client = signerClient!;
      } else {
        client = await DesmosClient.connect("https://rpc.morpheus.desmos.network:443", {
          gasPrice: GasPrice.fromString("0.2udaric"),
        });
      }
      return client!.querier.postsV3.subspacePosts(Long.fromValue(1));
    },
  )

  return <Grid2
    sx={{m: 2}}
    container
    direction={"column"}
    alignItems={"center"}
  >
    <List sx={{ minWidth: "70%", bgcolor: "background.paper", alignItems: "center"}}>
      { signerStatus === SignerStatus.Connected  && 
        <TextField 
          multiline sx={{ m: 1 }} 
          fullWidth label="create post" 
          InputProps={{endAdornment: (
            <InputAdornment position="end">
              <IconButton edge="end" color="primary">
                Create<CreateIcon />
              </IconButton>
            </InputAdornment>)}} 
          />
      }
      {isLoading && <div>Loading...</div>}
      {isError && <div>Fetching error</div>}
      {isSuccess && data === undefined && <div>Empty</div>}
      {isSuccess && data !== undefined && data.posts.map((post, key) => {
          return <Post key={key} user={post.author} content={post.text} />
        })
      }
     </List>
  </Grid2>
}