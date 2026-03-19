/**
 * Native fallback for HTML preview — shows a simple placeholder.
 * The actual rendering is handled by HtmlPreview.web.tsx on web.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  html: string;
  height?: number;
}

export default function HtmlPreview({ html, height = 220 }: Props) {
  return (
    <View style={[styles.placeholder, { height }]}>
      <Text style={styles.text}>📱 ดูตัวอย่างบนเว็บเบราว์เซอร์</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#9CA3AF',
    fontSize: 13,
  },
});
