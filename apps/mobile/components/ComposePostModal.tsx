import { router } from 'expo-router';

// ... inside component ...

  const handleCreateVideo = () => {
      onClose();
      router.push('/studio/create');
  };

// ... inside render ...

                    {/* Attachments Area */}
                    <View style={styles.attachments}>
                        <TouchableOpacity style={styles.attachButton} onPress={handleAttachVerse}>
                            <Ionicons name="book-outline" size={20} color="#4A90E2" />
                            <Text style={styles.attachText}>Verse</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={[styles.attachButton, { borderColor: '#7C3AED' }]} onPress={handleCreateVideo}>
                            <Ionicons name="videocam-outline" size={20} color="#7C3AED" />
                            <Text style={[styles.attachText, { color: '#7C3AED' }]}>Video</Text>
                        </TouchableOpacity>
                    </View>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelText: {
    fontSize: 16,
    color: '#000',
  },
  postButton: {
    backgroundColor: '#007AFF', // brand-blue
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#99c9ff',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    fontSize: 18,
    color: '#333',
    minHeight: 100,
  },
  attachments: {
    marginTop: 16,
    flexDirection: 'row',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 16,
    gap: 6,
  },
  attachText: {
    color: '#4A90E2',
    fontWeight: '500',
    fontSize: 14,
  },
});
