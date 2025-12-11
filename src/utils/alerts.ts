import { Alert } from 'react-native';

export const confirmAction = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = 'OK',
  cancelText: string = 'Cancel'
) => {
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
};

export const showError = (message: string, title = 'Error') => {
  Alert.alert(title, message);
};

export const showSuccess = (message: string, title = 'Success') => {
  Alert.alert(title, message);
};



