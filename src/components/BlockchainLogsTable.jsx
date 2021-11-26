import React from "react";
import PropTypes from "prop-types";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

function BlockchainLogsTable(props) {
  if (props.logs === undefined)
    props.logs = [];

  console.log(props.logs);

  return (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Blockchain Logs</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.logs.map((message) => (
            <TableRow key={message+Math.random()}>
              <TableCell component="th" scope="row" sx={{whiteSpace: 'pre'}}>
                {message}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

BlockchainLogsTable.propTypes = {
  logs: PropTypes.array
}

export default React.memo(BlockchainLogsTable);
