import React from 'react';
import { Alert, BackHandler, Platform, ToastAndroid, TouchableOpacity } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from './store';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme';
import FloatingTabBar from './components/navigation/FloatingTabBar';
// Screens
import LoginScreen from './screens/auth/LoginScreen';
import AdminDashboard from './screens/admin/Dashboard';
import AdminStudents from './screens/admin/Students';
import AdminStudentForm from './screens/admin/StudentForm';
import AdminAttendance from './screens/admin/Attendance';
import AdminNotifications from './screens/admin/Notifications';
import StudentHome from './screens/student/Home';
import StudentScanQR from './screens/student/ScanQR';
import StudentNotifications from './screens/student/Notifications';
import StudentCalendarScreen from './screens/student/CalendarScreen';
import StudentProfile from './screens/student/Profile';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();

function AdminTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Students') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Attendance') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Notifications') iconName = focused ? 'notifications' : 'notifications-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.text, fontWeight: '700' },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Students" component={AdminStudents} />
      <Tab.Screen name="Attendance" component={AdminAttendance} />
      <Tab.Screen name="Notifications" component={AdminNotifications} />
    </Tab.Navigator>
  );
}

function StudentTabs() {
  const currentUser      = useAppStore((s) => s.currentUser);
  const notifications    = useAppStore((s) => s.notifications);
  const lastNotifSeenAt  = useAppStore((s) => s.lastNotifSeenAt);

  const unread = (() => {
    if (!currentUser) return 0;
    const cutoff = lastNotifSeenAt ? new Date(lastNotifSeenAt).getTime() : 0;
    return notifications.filter(
      (n) =>
        (n.targetId === 'all' || n.targetId === currentUser.id) &&
        new Date(n.date).getTime() > cutoff
    ).length;
  })();

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Scan Attendance') iconName = focused ? 'qr-code' : 'qr-code-outline';
          else if (route.name === 'Calendar') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Notifications') iconName = focused ? 'notifications' : 'notifications-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.text, fontWeight: '700' },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={StudentHome}
        options={({ navigation }) => ({
          tabBarLabel: 'Home',
          title: 'Student Home',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => (navigation.getParent() as any)?.navigate('StudentProfile')}
              style={{ marginRight: 4, padding: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Ionicons name="person-circle-outline" size={28} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen name="Scan Attendance" component={StudentScanQR} options={{ tabBarLabel: 'Scan', title: 'Scan Attendance' }} />
      <Tab.Screen name="Calendar" component={StudentCalendarScreen} options={{ tabBarLabel: 'Calendar', title: 'Attendance History' }} />
      <Tab.Screen
        name="Notifications"
        component={StudentNotifications}
        options={{ tabBarLabel: 'Notifications', title: 'Notifications', tabBarBadge: unread > 0 ? unread : undefined }}
      />
    </Tab.Navigator>
  );
}

function StudentMainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentTabs" component={StudentTabs} />
      <Stack.Screen
        name="StudentProfile"
        component={StudentProfile}
        options={{
          headerShown: true,
          title: 'Profile',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTitleStyle: { color: theme.colors.text, fontWeight: '700' },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const currentUser = useAppStore((state) => state.currentUser);
  const backPressRef = React.useRef(0);

  React.useEffect(() => {
    if (!currentUser) return;

    const studentRootTabs = ['Home', 'Scan Attendance', 'Calendar', 'Notifications'];
    const adminRootTabs = ['Dashboard', 'Students', 'Attendance', 'Notifications'];

    const handleBackPress = () => {
      if (!navigationRef.isReady()) return false;

      const route = navigationRef.getCurrentRoute();
      const routeName = route?.name ?? '';

      if (currentUser.role === 'student') {
        if (routeName && routeName !== 'Home' && studentRootTabs.includes(routeName)) {
          (navigationRef as any).navigate('StudentMain', {
            screen: 'StudentTabs',
            params: { screen: 'Home' },
          });
          return true;
        }
        if (routeName === 'Home') {
          const now = Date.now();
          if (backPressRef.current && now - backPressRef.current < 1800) {
            BackHandler.exitApp();
            return true;
          }
          backPressRef.current = now;
          if (Platform.OS === 'android') {
            ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
          } else {
            Alert.alert('Exit', 'Press back again to exit');
          }
          return true;
        }
      }

      if (currentUser.role === 'admin') {
        if (routeName && routeName !== 'Dashboard' && adminRootTabs.includes(routeName)) {
          (navigationRef as any).navigate('AdminMain', { screen: 'Dashboard' });
          return true;
        }
        if (routeName === 'Dashboard') {
          const now = Date.now();
          if (backPressRef.current && now - backPressRef.current < 1800) {
            BackHandler.exitApp();
            return true;
          }
          backPressRef.current = now;
          if (Platform.OS === 'android') {
            ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
          } else {
            Alert.alert('Exit', 'Press back again to exit');
          }
          return true;
        }
      }

      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [currentUser]);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark: false,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: '#EF4444',
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : currentUser.role === 'admin' ? (
          <>
            <Stack.Screen name="AdminMain" component={AdminTabs} />
            <Stack.Screen
              name="AdminStudentForm"
              component={AdminStudentForm}
              options={{
                headerShown: true,
                title: 'Student Details',
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.text,
                headerTitleStyle: { fontWeight: '700' },
                headerShadowVisible: false,
              }}
            />
          </>
        ) : (
          <Stack.Screen name="StudentMain" component={StudentMainStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
