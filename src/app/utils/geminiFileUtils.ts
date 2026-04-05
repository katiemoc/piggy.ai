export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      const parts = base64String.split(',');
      if (parts.length > 1) {
        resolve(parts[1]);
      } else {
        reject(new Error('Invalid base64 string'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};
