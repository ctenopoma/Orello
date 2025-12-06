import PublicBoardsView from "~/views/public/boards";

export default function PublicBoardsPage() {
  return <PublicBoardsView />;
}

// Force SSR to avoid router.query issues during build
export const getServerSideProps = () => {
  return { props: {} };
};
