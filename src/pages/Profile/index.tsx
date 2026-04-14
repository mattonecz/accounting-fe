import * as axios from 'axios';
import { useUserProfileGet } from '@/api/user-profile/user-profile';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileForm } from './ProfileForm';
import { CompanyForm } from './CompanyForm';

const Profile = () => {
  const { user } = useAuth();

  const {
    data: profileResponse,
    error: profileError,
    isError,
    isLoading,
    refetch,
  } = useUserProfileGet({ query: { retry: false } });

  const profile = profileResponse?.data;
  const profileErrorStatus = axios.isAxiosError(profileError)
    ? profileError.response?.status
    : undefined;
  const isMissingProfile = profileErrorStatus === 404;
  const hasExistingProfile = Boolean(profile?.id);
  const normalizedCompanyId = user?.companyId?.trim() ?? '';

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader
          title="Profil"
          description="Načítám profilové údaje z API."
        />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Načítám profil...
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  if (isError && !isMissingProfile) {
    return (
      <PageLayout>
        <PageHeader
          title="Profil"
          description="Spravujte kontaktní údaje používané pro daňová podání."
        />
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Profil se nepodařilo načíst</CardTitle>
            <CardDescription>
              Server profil nevrátil. Zkuste načtení zopakovat, než provedete
              změny.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void refetch()}>
              Načíst znovu
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <PageHeader
        title="Profil"
        description="Spravujte kontaktní údaje a hodnoty používané pro podání na finanční správu."
      />

      {isMissingProfile && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Profil zatím neexistuje. Po uložení se vytvoří nový záznam.
          </CardContent>
        </Card>
      )}

      <ProfileForm
        profile={profile}
        user={user}
        isMissingProfile={isMissingProfile}
        isLoading={isLoading}
        hasExistingProfile={hasExistingProfile}
      />

      <CompanyForm companyId={normalizedCompanyId} />
    </PageLayout>
  );
};

export default Profile;
