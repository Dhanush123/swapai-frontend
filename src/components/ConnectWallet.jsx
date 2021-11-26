/* eslint-disable react/prop-types */
import React from "react";

import NetworkErrorMessage from "./NetworkErrorMessage";
import GenericButton from "./GenericButton";

function ConnectWallet({ connectWallet, networkError, dismiss }) {
  return (
    <div className="container"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        display: "inline-block",
      }}
    >
      <div className="row justify-content-md-center">
        <div className="col-12 text-center">
          {networkError && (
            <NetworkErrorMessage 
              message={networkError} 
              dismiss={dismiss} 
            />
          )}
        </div>
        <div className="col-6 p-4 text-center">
          <p>Please connect to your wallet.</p>
          <GenericButton
            className="btn btn-warning"
            type="button"
            onClick={connectWallet}
            label="Connect Wallet"
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(ConnectWallet);
