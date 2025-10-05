import React, { useState, useEffect, useCallback } from 'react';
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
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const handleSplashComplete = useCallback(async () => {
    // Hide native splash when our animation completes
    await SplashScreen.hideAsync();
    setIsShowingSplash(false);
  }, []);

  // Always show custom splash screen over everything
  if (isShowingSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {appIsReady && (
          <SplashScreenComponent 
            onAnimationComplete={handleSplashComplete}
          />
        )}
      </View>
    );
  }

  return <>{children}</>;
}