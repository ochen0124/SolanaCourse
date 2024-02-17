import { NextPage } from 'next'
import styles from '../styles/Home.module.css'
import WalletContextProdiver from "../components/WalletContextProvider";
import { AppBar } from '../components/AppBar'
import Head from 'next/head'
import { PingButton } from '../components/PingButton'

const Home: NextPage = (props) => {

  return (
    <div className={styles.App}>
      <Head>
        <title>Wallet-Adapter Example</title>
        <meta
          name="description"
          content="Wallet-Adapter Example"
        />
      </Head>
      <WalletContextProdiver>
        <AppBar />
        <div className={styles.AppBody}>
          <PingButton/>
        </div>
      </WalletContextProdiver>
    </div>
  );
};

export default Home;