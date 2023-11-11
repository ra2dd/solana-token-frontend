import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC, useState } from "react";
import styles from "../styles/Home.module.css";

import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getMint,
  getAccountLenForMint,
  createInitializeAccountInstruction,
} from "@solana/spl-token";


export const CreateTokenAccountForm: FC = () => {
  const [txSig, setTxSig] = useState("");
  const [tokenAccount, setTokenAccount] = useState("");
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [ mint, setMint ] = useState("");
  const [ accountOwner, setAccoutOwner ] = useState("");
  const [ isAccountUnique, setIsAccountUnique ] = useState(false);

  const link = () => {
    return txSig
      ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet`
      : "";
  };

  const createTokenAccount = async (event) => {
    event.preventDefault();
    if (!connection || !publicKey ) {
      return alert('Connet solana wallet.');
    }

    if (!mint || !accountOwner) {
      return alert('Make sure mint and account fields are correct.');
    }

    // BUILD AND SEND CREATE TOKEN ACCOUNT TRANSACTION HERE
    const mintPublicKey = new web3.PublicKey(mint)
    const accountOwnerPublicKey = new web3.PublicKey(accountOwner)

    if (isAccountUnique) {
      createUniqueTokenAccount(mintPublicKey, accountOwnerPublicKey)
    }
    else {
      createAssociatedAccount(mintPublicKey, accountOwnerPublicKey)
    }
  };

  return (
    <div>
      <br />
      {publicKey ? (
        <form onSubmit={createTokenAccount} className={styles.form}>
          <label htmlFor="owner">Token Mint:</label>
          <input
            id="mint"
            type="text"
            className={styles.formField}
            placeholder="Enter Token Mint"
            required
            onChange={(event) => setMint(event.target.value)}
          />
          <label htmlFor="owner">Token Account Owner:</label>
          <input
            id="owner"
            type="text"
            className={styles.formField}
            placeholder="Enter Token Account Owner PublicKey"
            required
            onChange={(event) => setAccoutOwner(event.target.value)}
          />
          <label htmlFor="uniqueAccount">
            Should generated token account be unique?
          </label>
          <input
            id="uniqueAccount"
            type="checkbox"
            className={styles.formField}
            onChange={() => setIsAccountUnique(!isAccountUnique)}
          />
          <button type="submit" className={styles.formButton}>
            Create Token Account
          </button>
        </form>
      ) : (
        <span></span>
      )}
      {tokenAccount? (
        <div>
          <p>Token Account Address: {tokenAccount}</p>
        </div>
      ) : null}
      {txSig ? (
        <div>
          <p>View your transaction on </p>
          <a href={link()}>Solana Explorer</a>
        </div>
      ) : null}
    </div>
  );

  async function createUniqueTokenAccount(
    mintPublicKey: web3.PublicKey, 
    accountOwnerPublicKey: web3.PublicKey) {
    // Building transaction account using generated keypair
    // Certain user can have multiple unique token accoutns
    const mintState =  await getMint(connection, mintPublicKey);
    const accountKeypair = web3.Keypair.generate();
    const space = getAccountLenForMint(mintState);
    const lamports = await connection.getMinimumBalanceForRentExemption(space);

    const transaction = new web3.Transaction().add(
      web3.SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: accountKeypair.publicKey,
        space,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeAccountInstruction(
        accountKeypair.publicKey,
        mintPublicKey,
        accountOwnerPublicKey,
        TOKEN_PROGRAM_ID
      )
    );

    try {
      sendTransaction(transaction, connection, { signers: [accountKeypair] })
      .then((sig) => {
        setTokenAccountAndSignature(accountKeypair.publicKey, sig);
      });
    } catch (error) {
      alert(JSON.stringify(error));
    }
  }

  async function createAssociatedAccount(
    mintPublicKey: web3.PublicKey,
    accountOwnerPublicKey: web3.PublicKey) {
    const associatedTokenAccountAddress = await getAssociatedTokenAddress(mintPublicKey, accountOwnerPublicKey, false);
    const accountInfo = connection.getAccountInfo(associatedTokenAccountAddress)
    .then((info) => {
      if (info != null) {
        setTokenAccount(associatedTokenAccountAddress.toString());
        return alert(
        'Associated token account address for mint already exists. Click ok and see account address below.');
      }
  
      // https://solana-labs.github.io/solana-program-library/token/js/functions/createAssociatedTokenAccountInstruction.html
      const transaction = new web3.Transaction().add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          associatedTokenAccountAddress,
          accountOwnerPublicKey,
          mintPublicKey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        )
      )

      try {
        sendTransaction(transaction, connection)
        .then((sig) => {
          setTokenAccountAndSignature(associatedTokenAccountAddress, sig);
        });
      } catch (error) {
        alert(JSON.stringify(error));
      }
    });
  }

  function setTokenAccountAndSignature(
    tokenAccountPublicKey: web3.PublicKey,
    signature :string
  ) {
    const tokenAccountPublicKeyString = tokenAccountPublicKey.toString();
    setTokenAccount(tokenAccountPublicKeyString);
    setTxSig(signature);
    console.log(signature);
  }
};