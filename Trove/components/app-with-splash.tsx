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
        // For now, we'll just wait a moment
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        // Hide the native splash screen
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const handleSplashComplete = () => {
    setIsShowingSplash(false);
  };

  if (!appIsReady || isShowingSplash) {
    return (
      <View style={{ flex: 1 }}>
        {appIsReady && (
          <SplashScreenComponent onAnimationComplete={handleSplashComplete} />
        )}
      </View>
    );
  }

  return <>{children}</>;
}