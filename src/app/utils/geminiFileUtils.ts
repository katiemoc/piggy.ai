export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let base64String = reader.result as string;
      const base64ContentArray = base64String.split(',');
      if (base64ContentArray.length > 1) {
        resolve(base64ContentArray[1]);
      } else {
        reject(new Error('Invalid base64 string'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};
