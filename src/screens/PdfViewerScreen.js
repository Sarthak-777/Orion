import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Pdf from 'react-native-pdf';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export function PdfViewerScreen({ route, navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { tab } = route.params;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{tab.name}</Text>
        </View>
        <View style={styles.pageInfo}>
          <Text style={styles.pageText}>
            {totalPages > 0 ? `${currentPage}/${totalPages}` : ''}
          </Text>
        </View>
      </View>

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.textSecondary} />
          </View>
        )}
        <Pdf
          source={{ uri: tab.uri }}
          style={styles.pdf}
          onLoadComplete={(numberOfPages) => {
            setTotalPages(numberOfPages);
            setIsLoading(false);
          }}
          onPageChanged={(page) => {
            setCurrentPage(page);
          }}
          onError={(error) => {
            console.error('PDF Error:', error);
            setIsLoading(false);
          }}
          enablePaging={true}
          horizontal={false}
          fitPolicy={0}
          spacing={0}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
  },
  pageInfo: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  pageText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: theme.colors.surface,
  },
});
