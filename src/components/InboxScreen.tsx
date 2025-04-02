import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

const InboxScreen = () => {
  const [invitations, setInvitations] = useState([
    { id: '1', groupName: 'IITJ to Airport', status: 'pending', sender: 'Harsh' },
    { id: '2', groupName: 'Station to NIFT', status: 'pending', sender: 'Khushi' },
  ]);

  const handleInviteResponse = (inviteId: string, action: 'accept' | 'decline') => {
    setInvitations((prev) =>
      prev.map((invite) =>
        invite.id === inviteId ? { ...invite, status: action === 'accept' ? 'accepted' : 'declined' } : invite
      )
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Group Invitations</Text>
      <FlatList
        data={invitations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.groupName}>{item.groupName}</Text>
            <Text>Sender: {item.sender}</Text>  {/* Wrap text correctly */}
            <Text>Status: {item.status}</Text>
            {item.status === 'pending' && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.acceptButton]}
                  onPress={() => handleInviteResponse(item.id, 'accept')}
                >
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.declineButton]}
                  onPress={() => handleInviteResponse(item.id, 'decline')}
                >
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
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
  card: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  groupName: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  acceptButton: {
    backgroundColor: '#3b82f6',
  },
  declineButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InboxScreen;
