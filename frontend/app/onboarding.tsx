// Onboarding removed — redirect to auth
import { Redirect } from 'expo-router';
export default function Onboarding() {
  return <Redirect href="/auth" />;
}
