import { redirect } from "next/navigation";

export const metadata = {
  title: "Trexiti Admin | Private Operating Console",
  description: "Private Trexiti admin console.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function CRM() {
  redirect("/admin");
}
