import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      router.replace("/boards");
    }
  }, [router]);

  return null;
}

// Force SSR to avoid router.query issues during build
export const getServerSideProps = () => {
  return { props: {} };
};
