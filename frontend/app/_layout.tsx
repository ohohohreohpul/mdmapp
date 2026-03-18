import { Stack } from 'expo-router';
import { UserProvider } from '../contexts/UserContext';

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course-detail" />
        <Stack.Screen name="lesson" />
        <Stack.Screen name="quiz" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="admin/courses" />
        <Stack.Screen name="admin/materials" />
        <Stack.Screen name="admin/quiz-generator" />
      </Stack>
    </UserProvider>
  );
}