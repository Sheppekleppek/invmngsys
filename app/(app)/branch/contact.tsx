import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Mail, Check, AlertCircle } from 'lucide-react-native';
import * as MailComposer from 'expo-mail-composer';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ContactScreen() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const sendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      setStatus('error');
      setErrorMessage('Please fill in both subject and message fields');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (!isAvailable) {
        setStatus('error');
        setErrorMessage('Email service is not available on this device');
        setIsLoading(false);
        return;
      }

      // Format the email content
      const emailContent = `
Message from: ${user?.username || 'Branch Manager'}
Branch: ${user?.branchName || 'Unknown Branch'}

${message}
      `;

      await MailComposer.composeAsync({
        recipients: ['bilalalattar84@gmail.com'],
        subject: `[sheppek leppek] ${subject}`,
        body: emailContent,
      });

      // Reset form
      setSubject('');
      setMessage('');
      setStatus('success');
    } catch (error) {
      console.error('Error sending email:', error);
      setStatus('error');
      setErrorMessage('Failed to send email. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Contact Main Warehouse</Text>
          </View>

          <Animated.View
            style={styles.contactContainer}
            entering={FadeInDown.duration(500)}
          >
            <View style={styles.iconContainer}>
              <Mail size={32} color="#0F3460" />
            </View>
            
            <Text style={styles.title}>Send Message to Head Office</Text>
            <Text style={styles.subtitle}>
              Use this form to contact the main warehouse manager for any queries or issues.
            </Text>

            {status === 'success' && (
              <View style={styles.successContainer}>
                <Check size={20} color="#38A169" style={{ marginRight: 8 }} />
                <Text style={styles.successText}>Message sent successfully!</Text>
              </View>
            )}

            {status === 'error' && (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color="#E53E3E" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Subject</Text>
              <TextInput
                style={styles.formInput}
                value={subject}
                onChangeText={setSubject}
                placeholder="Enter message subject"
                placeholderTextColor="#A0AEC0"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Message</Text>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Type your message here..."
                placeholderTextColor="#A0AEC0"
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendEmail}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Send size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.sendButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
            
            <View style={styles.contactInfo}>
              <Text style={styles.contactInfoTitle}>Direct Contact</Text>
              <Text style={styles.contactInfoText}>
                Alternatively, you can directly email the main warehouse manager at:
              </Text>
              <Text style={styles.emailText}>bilalalattar84@gmail.com</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
  },
  contactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
    marginBottom: 24,
    lineHeight: 22,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#38A169',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#E53E3E',
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#4A5568',
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#1A202C',
  },
  messageInput: {
    height: 150,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#1A202C',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F3460',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  contactInfo: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3182CE',
  },
  contactInfoTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#2D3748',
    marginBottom: 8,
  },
  contactInfoText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#4A5568',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#3182CE',
  },
});