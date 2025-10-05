import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import SplashScreenComponent from './splash-screen';

interface AppWithSplashProps {
  children: React.ReactNode;
}

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function AppWithSplash({ children }: AppWithSplashProps) {
  const [isShowingSplash, setIsShowingSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // Keep this minimal to avoid delays
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const handleSplashComplete = () => {
    setIsShowingSplash(false);
  };

  // Show custom splash screen immediately when app is ready
  if (!appIsReady || isShowingSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {appIsReady && (
          <SplashScreenComponent 
            onAnimationComplete={handleSplashComplete}
            onStart={() => {
              // Hide native splash screen when custom animation starts
              SplashScreen.hideAsync();
            }}
          />
        )}
      </View>
    );
  }

  return <>{children}</>;
}