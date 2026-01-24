import type { Metadata } from "next";
import { UsersContent } from "./UsersContent";

export const metadata: Metadata = {
	title: "Créateurs",
	description: "Découvrez les créateurs de la communauté Poplist",
};

export default function UsersPage() {
	return <UsersContent />;
}
