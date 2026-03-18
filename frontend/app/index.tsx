import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to splash screen on app launch
  return <Redirect href="/splash" />;
}
