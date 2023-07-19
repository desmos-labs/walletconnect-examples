import * as React from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

export interface Props {
   dtag: String,
   content: String
};
  
export const Post: React.FC<Props> = ({dtag, content}) => {
    return <ListItem sx={{ border: 2, borderRadius: 2, m: 1}} alignItems={"flex-start"}>
        <ListItemText
            secondaryTypographyProps={{fontSize: '1.5em'}}
            style={{whiteSpace: 'pre-line'}}
            secondary={
            <React.Fragment>
                { dtag } : <br/>
                { content }
            </React.Fragment>
            }
        />
    </ListItem>
}