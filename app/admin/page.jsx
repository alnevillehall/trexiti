import CRMPage from "../components/CRMPage";

export const metadata = {
  title: "Trexiti Admin | Private Operating Console",
  description: "Private Trexiti admin console for managing leads, audits, pipeline, outreach, and PropertyOS opportunities.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function Admin() {
  return <CRMPage />;
}
