import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

const GroupDetailsScreen = () => {
  const route = useRoute();
  const { groupId, groupName, members } = route.params;

  const offerRide = () => {
    console.log(`Offering ride to members of ${groupName}`);
    // Firebase logic to send notification to all members
    // sendRideOfferNotification(members);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{groupName}</Text>
      <Text>Members: {members.join(', ')}</Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.memberCard}>
            <Text>{item}</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.button} onPress={offerRide}>
        <Text style={styles.buttonText}>Offer a Ride</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  memberCard: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GroupDetailsScreen;
