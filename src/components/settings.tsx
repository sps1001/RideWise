import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../service/themeContext';

const Settings = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <View style={[styles.container, isDarkMode && styles.darkBackground]}>
      <Text style={[styles.title, isDarkMode && styles.darkText]}>Settings</Text>
      <View style={styles.settingItem}>
        <Text style={[styles.settingText, isDarkMode && styles.darkText]}>Dark Mode</Text>
        <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
      </View>
      <TouchableOpacity style={[styles.button, isDarkMode && styles.darkButton]}>
        <Text style={[styles.buttonText, isDarkMode && styles.darkText]}>Manage Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  darkBackground: {
    backgroundColor: "black",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "black",
  },
  darkText: {
    color: "white",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  settingText: {
    fontSize: 18,
    color: "black",
  },
  button: {
    padding: 10,
    backgroundColor: "blue",
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  darkButton: {
    backgroundColor: "gray",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});

export default Settings;