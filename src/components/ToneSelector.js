import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TONES = [
  {
    id: 'warmer',
    name: 'Warmer',
    description: 'Makes messages friendlier and more inviting',
    icon: 'heart',
  },
  {
    id: 'profanity-free',
    name: 'Profanity-Free',
    description: 'Removes or replaces inappropriate language',
    icon: 'shield-checkmark',
  },
  {
    id: 'formal',
    name: 'More Formal',
    description: 'Adjusts to professional tone',
    icon: 'business',
  },
  {
    id: 'simplified',
    name: 'Simplified / Clearer',
    description: 'Rephrases complex language into plain English',
    icon: 'chatbubble-ellipses',
  },
  {
    id: 'concise',
    name: 'Concise / Brief',
    description: 'Shortens messages to be more direct',
    icon: 'time',
  },
];

export default function ToneSelector({ visible, onClose, onSelectTone, currentTone }) {
  const [selectedTone, setSelectedTone] = useState(currentTone || null);

  const handleToneSelect = (tone) => {
    setSelectedTone(tone);
    onSelectTone(tone);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Message Tone</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.toneList}>
            {TONES.map((tone) => (
              <TouchableOpacity
                key={tone.id}
                style={[
                  styles.toneOption,
                  selectedTone?.id === tone.id && styles.selectedTone
                ]}
                onPress={() => handleToneSelect(tone)}
              >
                <View style={styles.toneIcon}>
                  <Ionicons 
                    name={tone.icon} 
                    size={24} 
                    color={selectedTone?.id === tone.id ? '#007AFF' : '#8E8E93'} 
                  />
                </View>
                <View style={styles.toneInfo}>
                  <Text style={[
                    styles.toneName,
                    selectedTone?.id === tone.id && styles.selectedToneName
                  ]}>
                    {tone.name}
                  </Text>
                  <Text style={styles.toneDescription}>
                    {tone.description}
                  </Text>
                </View>
                {selectedTone?.id === tone.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {selectedTone && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleToneSelect(null)}
            >
              <Text style={styles.clearButtonText}>Clear Tone Filter</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#C6C6C8',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  toneList: {
    padding: 20,
  },
  toneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedTone: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  toneIcon: {
    width: 40,
    alignItems: 'center',
  },
  toneInfo: {
    flex: 1,
    marginLeft: 15,
  },
  toneName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  selectedToneName: {
    color: '#007AFF',
  },
  toneDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  clearButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 