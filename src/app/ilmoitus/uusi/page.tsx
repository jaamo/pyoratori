import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PostingForm } from "@/components/postings/posting-form";

export default function NewPostingPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Uusi ilmoitus</CardTitle>
          <CardDescription>
            Täytä tiedot ja julkaise ilmoituksesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostingForm />
        </CardContent>
      </Card>
    </div>
  );
}
