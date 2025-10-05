import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import PickaxeLoadingScreen from './PickaxeLoadingScreen';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // Show loading for 5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PickaxeLoadingScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Your main app content goes here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;