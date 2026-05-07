/**
 * Nexus Attendo — WebView App
 * Wraps the deployed web app in a native Android shell.
 * GPS location permission is requested natively for attendance marking.
 * Download listener handles PDF/Excel file downloads from the WebView.
 */

import { useEffect, useRef } from 'react';
import { StyleSheet, PermissionsAndroid, Platform, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const APP_URL = 'https://nexon-attendance.vercel.app';

// Injected JS: intercepts anchor clicks with download attribute
// and posts the data back to the native layer
const INJECTED_JS = `
(function() {
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (el && el.hasAttribute('download') && el.href) {
      e.preventDefault();
      var url = el.href;
      var fileName = el.getAttribute('download') || 'download';
      if (url.startsWith('blob:')) {
        fetch(url)
          .then(function(r) { return r.blob(); })
          .then(function(blob) {
            var reader = new FileReader();
            reader.onloadend = function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'download',
                base64: reader.result,
                fileName: fileName
              }));
            };
            reader.readAsDataURL(blob);
          })
          .catch(function(err) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'downloadError',
              error: err.message
            }));
          });
      } else if (url.startsWith('data:')) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'download',
          base64: url,
          fileName: fileName
        }));
      }
    }
  }, true);
})();
true;
`;

export default function App() {
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'download' && data.base64 && data.fileName) {
        const base64String = data.base64;
        const mimeType = base64String.split(';')[0].replace('data:', '') || 'application/octet-stream';
        const base64Data = base64String.split(',')[1] || base64String;

        const ext = mimeType.includes('pdf') ? '.pdf'
          : mimeType.includes('sheet') || mimeType.includes('excel') ? '.xlsx'
          : '';

        const fileName = data.fileName.includes('.') ? data.fileName : data.fileName + ext;
        const fileUri = (FileSystem.documentDirectory || '') + fileName;

        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType,
            dialogTitle: 'Save ' + fileName,
          });
        }
      }
    } catch {
      // Ignore non-download messages
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <WebView
          ref={webViewRef}
          source={{ uri: APP_URL }}
          style={styles.webview}
          geolocationEnabled={true}
          mediaCapturePermissionGrantType="grant"
          scalesPageToFit={false}
          cacheEnabled={true}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          onShouldStartLoadWithRequest={() => true}
          startInLoadingState={true}
          overScrollMode="never"
          injectedJavaScript={INJECTED_JS}
          onMessage={handleMessage}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
});
