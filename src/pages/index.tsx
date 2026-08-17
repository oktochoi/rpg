import Head from "next/head";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import styles from "@/styles/Home.module.css";
import dynamic from "next/dynamic";

const sans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ui",
});

const serif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-story",
});

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>잿빛 연대기</title>
        <meta name="description" content="AI 텍스트 RPG" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <main className={`${styles.main} ${sans.variable} ${serif.variable} ${sans.className}`}>
        <AppWithoutSSR />
      </main>
    </>
  );
}
