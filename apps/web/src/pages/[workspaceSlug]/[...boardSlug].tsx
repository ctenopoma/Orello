import PublicBoardView from "~/views/public/board";

export default function PublicBoardsPage() {
  return <PublicBoardView />;
}

// Force SSR to avoid router.query issues during build
export const getServerSideProps = () => {
  return { props: {} };
};
